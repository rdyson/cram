import OpenAI from 'openai';
import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';
import { topicPrompt } from '@/lib/topics';
import { validateGeneratedBatch, validationSummary } from '@/lib/generation';

function scoreExcerptForTopic(text: string, topic: { name: string; services: string[] | null; concepts: string[] | null }) {
  const lower = text.toLowerCase();
  const terms = [topic.name, ...(topic.services ?? []), ...(topic.concepts ?? [])].map((x) => x.toLowerCase());
  const hits = terms.filter((term) => lower.includes(term.toLowerCase())).length;
  return Math.min(0.95, hits / Math.max(3, terms.length));
}

async function repair(openai: OpenAI, raw: string, error: unknown) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'Repair generated SAA-C03 study-item JSON. Return JSON only. Do not remove items unless impossible to repair.'
      },
      {
        role: 'user',
        content: `Validation errors:\n${validationSummary(error)}\n\nRequired shape:\n{ "items": [ { "type": "flashcard" | "scenario_question", "topic": string, "domain": string, "difficulty": "easy" | "medium" | "hard", "prompt": string, "answer": string for flashcards, "answer_choices": [{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}] for scenario questions, "correct_answer_key": "A" | "B" | "C" | "D", "explanation": string, "why_wrong_answers_are_wrong": { "A": string, "B": string, "C": string, "D": string except omit the correct key } } ] }\n\nFor every scenario question, add a specific explanation for every wrong answer key.\n\nOriginal output:\n${raw}`
      }
    ]
  });
  return response.choices[0]?.message.content ?? '';
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  const supabase = supabaseAdmin();
  let jobId: string | null = null;
  try {
    const { deckId } = await request.json();
    if (!deckId) return Response.json({ error: 'deckId is required' }, { status: 400 });
    await assertDeckOwner(deckId, auth.user.id);

    const { data: assets, error: assetsError } = await supabase.from('uploaded_assets').select('id,type').eq('deck_id', deckId).eq('status', 'processed');
    if (assetsError) throw assetsError;

    const { data: job, error: jobError } = await supabase.from('generation_jobs').insert({
      deck_id: deckId,
      created_by: auth.user.id,
      status: 'running',
      stage: 'mapping',
      input_asset_ids: (assets ?? []).map((a) => a.id)
    }).select('*').single();
    if (jobError) throw jobError;
    jobId = job.id;

    const { data: allExcerpts, error: excerptsError } = await supabase
      .from('source_excerpts')
      .select('*, uploaded_assets(filename,type,created_at)')
      .eq('deck_id', deckId);
    if (excerptsError) throw excerptsError;
    if (!allExcerpts?.length) throw new Error('Upload notes or screenshots before generating study items.');

    const excerpts = allExcerpts
      .sort((a, b) => {
        const aType = a.uploaded_assets?.type === 'screenshot' ? 0 : 1;
        const bType = b.uploaded_assets?.type === 'screenshot' ? 0 : 1;
        if (aType !== bType) return aType - bType;
        return new Date(b.uploaded_assets?.created_at ?? b.created_at).getTime() - new Date(a.uploaded_assets?.created_at ?? a.created_at).getTime();
      })
      .slice(0, 48);

    const { data: topics, error: topicsError } = await supabase.from('exam_topics').select('*, exam_domains(*)').limit(50);
    if (topicsError) throw topicsError;
    if (!topics?.length) throw new Error('SAA-C03 topics are not seeded. Sign out and back in, then retry.');

    await supabase.from('source_excerpt_topics').delete().in('source_excerpt_id', excerpts.map((e) => e.id));
    const mappings = [];
    for (const excerpt of excerpts) {
      const matches = topics
        .map((topic) => ({ topic, confidence: scoreExcerptForTopic(excerpt.text, topic) }))
        .filter((match) => match.confidence > 0.08)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
      for (const match of matches) {
        mappings.push({
          source_excerpt_id: excerpt.id,
          exam_topic_id: match.topic.id,
          confidence: match.confidence,
          rationale: 'Keyword/concept match from Markdown source.'
        });
      }
    }
    if (mappings.length) await supabase.from('source_excerpt_topics').insert(mappings);

    await supabase.from('generation_jobs').update({ stage: 'generating', updated_at: new Date().toISOString() }).eq('id', jobId);

    const sourceText = excerpts.map((e, i) => {
      const asset = e.uploaded_assets;
      return `Excerpt ${i + 1} (${asset?.type ?? 'unknown'}: ${asset?.filename ?? 'unknown file'}):\n${e.text}`;
    }).join('\n\n').slice(0, 24000);
    const screenshotCount = excerpts.filter((e) => e.uploaded_assets?.type === 'screenshot').length;
    const prompt = `You create AWS SAA-C03 study material. Use the learner's notes/screenshots as exposure, not proof of mastery. Generate exactly 5 flashcards and exactly 5 scenario questions.

Important grounding rules:
- This generation context includes ${screenshotCount} screenshot excerpts and ${excerpts.length - screenshotCount} markdown excerpts.
- If screenshot excerpts are present, ground every flashcard and scenario question in concrete services or concepts visible in those screenshot excerpts.
- Do not default to generic IAM/security questions unless the source excerpts actually discuss IAM/security.
- Prefer the most specific services, comparisons, and architecture tradeoffs visible in the source excerpts.
- Scenario questions must test SAA-C03 architecture tradeoffs, not trivia.
- Scenario questions must have four choices, one best answer, explanation, and why each wrong answer is wrong.

Use these topic choices only:\n\n${topicPrompt()}\n\nLearner source excerpts:\n${sourceText}\n\nReturn JSON only: {"items":[...]}. Each item fields: type, topic, domain, difficulty, prompt, answer for flashcard, answer_choices for scenario, correct_answer_key for scenario, explanation, why_wrong_answers_are_wrong for scenario.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a precise AWS SAA-C03 exam prep item writer. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    });
    let raw = response.choices[0]?.message.content ?? '';
    let batch;
    try {
      batch = validateGeneratedBatch(raw);
    } catch (validationError) {
      raw = await repair(openai, raw, validationError);
      batch = validateGeneratedBatch(raw);
    }

    await supabase.from('generation_jobs').update({ stage: 'saving', updated_at: new Date().toISOString() }).eq('id', jobId);

    const findTopic = (name: string) => topics.find((topic) => topic.name.toLowerCase() === name.toLowerCase()) ?? topics.find((topic) => name.toLowerCase().includes(topic.name.toLowerCase().slice(0, 8))) ?? topics[0];
    const hasScreenshotSource = (assets ?? []).some((asset) => asset.type === 'screenshot');
    const primarySource = hasScreenshotSource ? 'screenshot' : 'markdown_notes';
    const rows = batch.items.map((item) => {
      const topic = findTopic(item.topic);
      return {
        deck_id: deckId,
        exam_domain_id: topic.domain_id,
        exam_topic_id: topic.id,
        type: item.type,
        source: primarySource,
        difficulty: item.difficulty,
        prompt: item.prompt,
        answer: item.answer ?? null,
        answer_choices: item.answer_choices ?? null,
        correct_answer_key: item.correct_answer_key ?? null,
        explanation: item.explanation,
        why_wrong_answers_are_wrong: item.why_wrong_answers_are_wrong ?? null
      };
    });
    await supabase.from('study_items').delete().eq('deck_id', deckId);
    const { data: items, error: insertError } = await supabase.from('study_items').insert(rows).select('*');
    if (insertError) throw insertError;
    await supabase.from('generation_jobs').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', jobId);
    return Response.json({ jobId, items });
  } catch (error) {
    const message = validationSummary(error) || 'Generation failed';
    if (jobId) await supabase.from('generation_jobs').update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() }).eq('id', jobId);
    return Response.json({ error: message }, { status: 500 });
  }
}

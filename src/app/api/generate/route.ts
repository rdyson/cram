import OpenAI from 'openai';
import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';
import { topicPrompt } from '@/lib/topics';
import { validateGeneratedBatch } from '@/lib/generation';

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
      { role: 'system', content: 'Repair this JSON so it matches the requested schema. Return JSON only.' },
      { role: 'user', content: `Validation error:\n${String(error)}\n\nOriginal output:\n${raw}` }
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

    const { data: excerpts, error: excerptsError } = await supabase.from('source_excerpts').select('*').eq('deck_id', deckId).limit(24);
    if (excerptsError) throw excerptsError;
    if (!excerpts?.length) throw new Error('Upload Markdown before generating study items.');

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

    const sourceText = excerpts.map((e, i) => `Excerpt ${i + 1}:\n${e.text}`).join('\n\n').slice(0, 14000);
    const prompt = `You create AWS SAA-C03 study material. Use the learner's notes as exposure, not proof of mastery. Generate exactly 5 flashcards and exactly 5 scenario questions. Scenario questions must have four choices, one best answer, explanation, and why each wrong answer is wrong. Use these topic choices only:\n\n${topicPrompt()}\n\nLearner notes:\n${sourceText}\n\nReturn JSON only: {"items":[...]}. Each item fields: type, topic, domain, difficulty, prompt, answer for flashcard, answer_choices for scenario, correct_answer_key for scenario, explanation, why_wrong_answers_are_wrong for scenario.`;

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
    const rows = batch.items.map((item) => {
      const topic = findTopic(item.topic);
      return {
        deck_id: deckId,
        exam_domain_id: topic.domain_id,
        exam_topic_id: topic.id,
        type: item.type,
        source: item.type === 'flashcard' ? (hasScreenshotSource ? 'screenshot' : 'markdown_notes') : 'blueprint_gap',
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
    if (jobId) await supabase.from('generation_jobs').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Generation failed', updated_at: new Date().toISOString() }).eq('id', jobId);
    return Response.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 });
  }
}

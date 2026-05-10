import { ensureProfileAndSeed, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';
import { coverageScore, diagnosis, masteryScore } from '@/lib/scoring';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    await ensureProfileAndSeed(auth.user);
    const { deckId } = await request.json().catch(() => ({ deckId: null }));
    const supabase = supabaseAdmin();
    const { data: decks } = await supabase.from('study_decks').select('*').eq('owner_user_id', auth.user.id).order('created_at', { ascending: false });
    const activeDeckId = deckId || decks?.[0]?.id || null;
    if (!activeDeckId) return Response.json({ decks: decks ?? [], activeDeck: null, assets: [], items: [], attempts: [], feedback: [], jobs: [], dashboard: [] });
    const activeDeck = decks?.find((deck) => deck.id === activeDeckId) ?? null;
    if (!activeDeck) return Response.json({ error: 'Deck not found' }, { status: 404 });

    const [assets, excerpts, mappings, items, attempts, feedback, jobs] = await Promise.all([
      supabase.from('uploaded_assets').select('*').eq('deck_id', activeDeckId).order('created_at', { ascending: false }),
      supabase.from('source_excerpts').select('*').eq('deck_id', activeDeckId),
      supabase.from('source_excerpt_topics').select('*, exam_topics(name, exam_domains(name))'),
      supabase.from('study_items').select('*, exam_topics(name, exam_domains(name))').eq('deck_id', activeDeckId).neq('status', 'hidden').order('created_at', { ascending: true }),
      supabase.from('practice_attempts').select('*').eq('deck_id', activeDeckId).eq('user_id', auth.user.id),
      supabase.from('study_item_feedback').select('*').eq('deck_id', activeDeckId).eq('user_id', auth.user.id),
      supabase.from('generation_jobs').select('*').eq('deck_id', activeDeckId).order('created_at', { ascending: false }).limit(5)
    ]);

    const excerptIds = new Set((excerpts.data ?? []).map((e) => e.id));
    const itemById = new Map((items.data ?? []).map((item) => [item.id, item]));
    const byTopic = new Map<string, { topic: string; domain: string; coverageCount: number; attempts: number; correct: number; confidenceTotal: number }>();
    for (const mapping of mappings.data ?? []) {
      if (!excerptIds.has(mapping.source_excerpt_id)) continue;
      const topic = mapping.exam_topics?.name ?? 'Unknown';
      const domain = mapping.exam_topics?.exam_domains?.name ?? 'Unknown';
      const stats = byTopic.get(topic) ?? { topic, domain, coverageCount: 0, attempts: 0, correct: 0, confidenceTotal: 0 };
      stats.coverageCount += 1;
      byTopic.set(topic, stats);
    }
    for (const attempt of attempts.data ?? []) {
      const item = itemById.get(attempt.study_item_id);
      const topic = item?.exam_topics?.name ?? 'Unknown';
      const domain = item?.exam_topics?.exam_domains?.name ?? 'Unknown';
      const stats = byTopic.get(topic) ?? { topic, domain, coverageCount: 0, attempts: 0, correct: 0, confidenceTotal: 0 };
      stats.attempts += 1;
      stats.correct += attempt.is_correct ? 1 : 0;
      stats.confidenceTotal += attempt.confidence_before ?? 0;
      byTopic.set(topic, stats);
    }
    const dashboard = [...byTopic.values()].map((stats) => {
      const avgConfidence = stats.attempts ? stats.confidenceTotal / stats.attempts : null;
      return {
        ...stats,
        coverageScore: coverageScore(stats.coverageCount),
        masteryScore: masteryScore(stats.attempts, stats.correct, avgConfidence),
        diagnosis: diagnosis({ topic: stats.topic, coverageCount: stats.coverageCount, attempts: stats.attempts, correct: stats.correct, avgConfidence })
      };
    }).sort((a, b) => a.masteryScore - b.masteryScore || b.coverageScore - a.coverageScore);

    return Response.json({
      decks: decks ?? [],
      activeDeck,
      assets: assets.data ?? [],
      items: items.data ?? [],
      attempts: attempts.data ?? [],
      feedback: feedback.data ?? [],
      jobs: jobs.data ?? [],
      dashboard
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'State load failed' }, { status: 500 });
  }
}

import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    const { deckId, studyItemId, selectedAnswerKey, confidenceBefore, timeToAnswerMs } = await request.json();
    if (!deckId || !studyItemId || !confidenceBefore) return Response.json({ error: 'Missing attempt fields' }, { status: 400 });
    await assertDeckOwner(deckId, auth.user.id);
    const supabase = supabaseAdmin();
    const { data: item, error: itemError } = await supabase.from('study_items').select('*').eq('id', studyItemId).eq('deck_id', deckId).single();
    if (itemError || !item) throw new Error('Study item not found');
    const isCorrect = item.type === 'flashcard' ? true : selectedAnswerKey === item.correct_answer_key;
    const { data, error } = await supabase.from('practice_attempts').insert({
      deck_id: deckId,
      user_id: auth.user.id,
      study_item_id: studyItemId,
      selected_answer_key: selectedAnswerKey,
      is_correct: isCorrect,
      confidence_before: confidenceBefore,
      time_to_answer_ms: timeToAnswerMs ?? null
    }).select('*').single();
    if (error) throw error;
    return Response.json({ attempt: data, item, isCorrect });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Attempt failed' }, { status: 500 });
  }
}

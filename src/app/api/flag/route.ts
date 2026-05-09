import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    const { deckId, studyItemId, reason, note } = await request.json();
    if (!deckId || !studyItemId || !reason) return Response.json({ error: 'Missing feedback fields' }, { status: 400 });
    await assertDeckOwner(deckId, auth.user.id);
    const supabase = supabaseAdmin();
    const { error: feedbackError } = await supabase.from('study_item_feedback').insert({
      deck_id: deckId,
      study_item_id: studyItemId,
      user_id: auth.user.id,
      reason,
      note
    });
    if (feedbackError) throw feedbackError;
    await supabase.from('study_items').update({ status: 'hidden' }).eq('id', studyItemId).eq('deck_id', deckId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Flag failed' }, { status: 500 });
  }
}

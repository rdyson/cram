import { ensureProfileAndSeed, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    await ensureProfileAndSeed(auth.user);
    const supabase = supabaseAdmin();
    const { data: decks, error } = await supabase
      .from('study_decks')
      .select('*')
      .eq('owner_user_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json({ decks });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Bootstrap failed' }, { status: 500 });
  }
}

import { ensureProfileAndSeed, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    const { title } = await request.json();
    if (!title || title.length < 2) return Response.json({ error: 'Title is required' }, { status: 400 });
    const exam = await ensureProfileAndSeed(auth.user);
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from('study_decks').insert({
      exam_id: exam.id,
      owner_user_id: auth.user.id,
      title,
      description: 'SAA-C03 blueprint-first study deck'
    }).select('*').single();
    if (error) throw error;
    return Response.json({ deck: data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Create deck failed' }, { status: 500 });
  }
}

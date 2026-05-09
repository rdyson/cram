import { supabaseAdmin, getUserFromRequest } from './supabase';
import { SAA_TOPICS } from './topics';

export async function requireUser(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  return { user } as const;
}

export async function ensureProfileAndSeed(user: { id: string; email?: string | null }) {
  const supabase = supabaseAdmin();
  await supabase.from('profiles').upsert({ id: user.id, email: user.email });
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .upsert({ code: 'SAA-C03', name: 'AWS Certified Solutions Architect - Associate' }, { onConflict: 'code' })
    .select('*')
    .single();
  if (examError) throw examError;

  const domainNames = [...new Map(SAA_TOPICS.map((t) => [t.domain, t.weight])).entries()];
  for (let index = 0; index < domainNames.length; index++) {
    const [name, weight] = domainNames[index];
    const { data: domain, error } = await supabase
      .from('exam_domains')
      .upsert({ exam_id: exam.id, name, weight_percent: weight, position: index + 1 }, { onConflict: 'exam_id,name' })
      .select('*')
      .single();
    if (error) throw error;
    const topics = SAA_TOPICS.filter((topic) => topic.domain === name);
    for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
      const topic = topics[topicIndex];
      const { error: topicError } = await supabase.from('exam_topics').upsert({
        exam_id: exam.id,
        domain_id: domain.id,
        name: topic.topic,
        description: topic.concepts.join(', '),
        services: topic.services,
        concepts: topic.concepts,
        common_misconceptions: topic.misconceptions,
        position: topicIndex + 1
      }, { onConflict: 'exam_id,name' });
      if (topicError) throw topicError;
    }
  }
  return exam;
}

export async function assertDeckOwner(deckId: string, userId: string) {
  const supabase = supabaseAdmin();
  const { data: deck, error } = await supabase.from('study_decks').select('*').eq('id', deckId).eq('owner_user_id', userId).single();
  if (error || !deck) throw new Error('Deck not found');
  return deck;
}

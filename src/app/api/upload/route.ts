import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

function chunkMarkdown(markdown: string) {
  const chunks: string[] = [];
  const sections = markdown.split(/\n(?=#{1,3}\s)/g).map((s) => s.trim()).filter(Boolean);
  for (const section of sections.length ? sections : [markdown]) {
    if (section.length <= 2400) chunks.push(section);
    else {
      for (let i = 0; i < section.length; i += 2200) chunks.push(section.slice(i, i + 2200));
    }
  }
  return chunks.slice(0, 24);
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    const form = await request.formData();
    const deckId = String(form.get('deckId') || '');
    const file = form.get('file');
    if (!deckId || !(file instanceof File)) return Response.json({ error: 'deckId and file are required' }, { status: 400 });
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) return Response.json({ error: 'Only Markdown files are supported in the first build.' }, { status: 400 });
    await assertDeckOwner(deckId, auth.user.id);
    const text = await file.text();
    if (!text.trim()) return Response.json({ error: 'Markdown file is empty.' }, { status: 400 });
    const supabase = supabaseAdmin();
    const { data: asset, error: assetError } = await supabase.from('uploaded_assets').insert({
      deck_id: deckId,
      uploaded_by: auth.user.id,
      filename: file.name,
      storage_path: `inline:${file.name}`,
      type: 'markdown',
      status: 'processed',
      extracted_text: text,
      processed_at: new Date().toISOString()
    }).select('*').single();
    if (assetError) throw assetError;

    const rows = chunkMarkdown(text).map((chunk) => ({ deck_id: deckId, asset_id: asset.id, text: chunk }));
    const { data: excerpts, error: excerptError } = await supabase.from('source_excerpts').insert(rows).select('*');
    if (excerptError) throw excerptError;
    return Response.json({ asset, excerpts });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 });
  }
}

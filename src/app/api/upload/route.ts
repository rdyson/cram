import { chunkText } from '@/lib/chunk';
import { extractScreenshotText } from '@/lib/ocr';
import { assertDeckOwner, requireUser } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';

function assetType(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || file.type.startsWith('image/')) return 'screenshot';
  return null;
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  try {
    const form = await request.formData();
    const deckId = String(form.get('deckId') || '');
    const file = form.get('file');
    if (!deckId || !(file instanceof File)) return Response.json({ error: 'deckId and file are required' }, { status: 400 });
    const type = assetType(file);
    if (!type) return Response.json({ error: 'Only Markdown, PNG, and JPG files are supported.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'File is too large. Keep screenshots under 8MB.' }, { status: 400 });
    await assertDeckOwner(deckId, auth.user.id);

    const supabase = supabaseAdmin();
    const { data: asset, error: assetError } = await supabase.from('uploaded_assets').insert({
      deck_id: deckId,
      uploaded_by: auth.user.id,
      filename: file.name,
      storage_path: `inline:${file.name}`,
      type,
      status: 'processing'
    }).select('*').single();
    if (assetError) throw assetError;

    try {
      const text = type === 'markdown' ? await file.text() : await extractScreenshotText(file);
      if (!text.trim()) throw new Error(type === 'markdown' ? 'Markdown file is empty.' : 'No text extracted from screenshot.');

      const { data: processedAsset, error: updateError } = await supabase.from('uploaded_assets').update({
        status: 'processed',
        extracted_text: text,
        processed_at: new Date().toISOString(),
        error_message: null
      }).eq('id', asset.id).select('*').single();
      if (updateError) throw updateError;

      const rows = chunkText(text).map((chunk) => ({ deck_id: deckId, asset_id: asset.id, text: chunk }));
      const { data: excerpts, error: excerptError } = await supabase.from('source_excerpts').insert(rows).select('*');
      if (excerptError) throw excerptError;
      return Response.json({ asset: processedAsset, excerpts });
    } catch (processingError) {
      await supabase.from('uploaded_assets').update({
        status: 'failed',
        error_message: processingError instanceof Error ? processingError.message : 'Processing failed'
      }).eq('id', asset.id);
      throw processingError;
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 });
  }
}

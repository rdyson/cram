import OpenAI from 'openai';

export async function extractScreenshotText(file: File) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const imageUrl = `data:${mime};base64,${bytes.toString('base64')}`;
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'Extract text from AWS certification slide screenshots. Preserve headings, bullets, AWS service names, architecture labels, and any diagram relationships. Return plain text only.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all visible text. If there is a diagram, add a short Diagram summary with relationships.' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]
  });
  const text = response.choices[0]?.message.content?.trim();
  if (!text) throw new Error('No text extracted from screenshot');
  return text;
}

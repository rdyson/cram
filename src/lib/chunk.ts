export function chunkText(text: string, maxChunks = 24) {
  const chunks: string[] = [];
  const sections = text.split(/\n(?=#{1,3}\s)/g).map((s) => s.trim()).filter(Boolean);
  for (const section of sections.length ? sections : [text]) {
    if (section.length <= 2400) chunks.push(section);
    else {
      for (let i = 0; i < section.length; i += 2200) chunks.push(section.slice(i, i + 2200));
    }
  }
  return chunks.slice(0, maxChunks);
}

import { describe, expect, it } from 'vitest';
import { chunkText } from './chunk';

describe('chunkText', () => {
  it('chunks markdown by headings', () => {
    const chunks = chunkText('# A\nhello\n# B\nworld');
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain('# A');
    expect(chunks[1]).toContain('# B');
  });

  it('caps chunk count', () => {
    const chunks = chunkText(Array.from({ length: 20 }, (_, i) => `# H${i}\ntext`).join('\n'), 3);
    expect(chunks).toHaveLength(3);
  });
});

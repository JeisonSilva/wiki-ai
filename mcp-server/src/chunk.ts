const MAX_CHUNK_CHARS = 1200;

/**
 * Splits a page body into chunks for embedding: one chunk per "## " section,
 * further split if a section is too long. Falls back to fixed-size chunks
 * when there are no "## " headings.
 */
export function chunkBody(title: string, body: string): string[] {
  const text = body.trim();
  if (!text) return [];

  const sections = splitBySections(text);
  const chunks: string[] = [];
  for (const section of sections) {
    if (section.length <= MAX_CHUNK_CHARS) {
      chunks.push(section);
      continue;
    }
    for (let i = 0; i < section.length; i += MAX_CHUNK_CHARS) {
      chunks.push(section.slice(i, i + MAX_CHUNK_CHARS));
    }
  }

  return chunks.map((c) => `${title}\n\n${c}`.trim());
}

function splitBySections(text: string): string[] {
  const lines = text.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^##\s+/.test(line) && current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current.join("\n").trim());

  return sections.filter((s) => s.length > 0);
}

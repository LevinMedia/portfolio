/**
 * Crepe/Milkdown may emit literal `<br>` (or `<br />`) inside markdown strings.
 * react-markdown does not parse that as HTML by default, so the tag text can appear in the UI.
 * Replace those tags with newlines so the markdown parser produces normal breaks.
 * Fenced code blocks are left unchanged so examples mentioning `<br>` stay intact.
 */
export function normalizeLiteralHtmlBreaksInMarkdown(source: string): string {
  if (!source || !/<br\b/i.test(source)) return source

  const fence = /```[\s\S]*?```|~~~[\s\S]*?~~~/g
  const chunks: string[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = fence.exec(source)) !== null) {
    chunks.push(replaceBrTags(source.slice(last, m.index)))
    chunks.push(m[0])
    last = m.index + m[0].length
  }
  chunks.push(replaceBrTags(source.slice(last)))
  return chunks.join('')
}

function replaceBrTags(s: string): string {
  return s.replace(/<br\b[^>]*>/gi, '\n')
}

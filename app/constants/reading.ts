export type ReadingFont = 'heiti' | 'songti'

export const DEFAULT_READING_FONT: ReadingFont = 'heiti'

export function normalizeReadingFont(font: unknown): ReadingFont {
  return font === 'songti' ? 'songti' : 'heiti'
}

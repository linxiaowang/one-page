export type ReadingFont = 'heiti' | 'songti'

export const DEFAULT_READING_FONT: ReadingFont = 'heiti'

export const READING_EXPORT_BACKGROUND = '#fafaf9'
export const READING_EXPORT_TEXT_COLOR = 'rgb(28, 25, 23)'
export const READING_EXPORT_SURFACE_WIDTH = '45rem'

export function normalizeReadingFont(font: unknown): ReadingFont {
  return font === 'songti' ? 'songti' : 'heiti'
}

import { appName } from '~/constants'

function stripInlineMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .trim()
}

export function extractFirstHeading(markdown: string): string | null {
  const lines = markdown.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line == null)
      continue

    const atx = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/)
    if (atx?.[2]) {
      const title = stripInlineMarkdown(atx[2])
      return title || null
    }

    const nextLine = lines[index + 1]?.trim()
    if (nextLine && /^(-{3,}|={3,})$/.test(nextLine) && line.trim()) {
      const title = stripInlineMarkdown(line.trim())
      return title || null
    }
  }

  return null
}

export function resolvePageTitleFromMarkdown(markdown: string): string {
  return extractFirstHeading(markdown) || appName
}

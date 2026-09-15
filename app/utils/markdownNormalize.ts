/** 语雀等导出的 Markdown 常带行内 font 标签，解析后会显示成原始 HTML 文本。 */
export function normalizeMarkdownForRender(markdown: string) {
  if (!markdown)
    return markdown

  return markdown
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
}

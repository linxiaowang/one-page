const IMPORT_EXTENSIONS = ['.md', '.txt'] as const

export function isMarkdownImportFile(file: File) {
  const name = file.name.toLowerCase()
  return IMPORT_EXTENSIONS.some(extension => name.endsWith(extension))
}

export function readMarkdownImportFile(file: File) {
  if (!isMarkdownImportFile(file))
    throw new Error('Unsupported file type')

  return file.text()
}

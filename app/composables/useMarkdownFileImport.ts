import { isMarkdownImportFile, readMarkdownImportFile } from '~/utils/markdownImport'

export function useMarkdownFileImport(content: Ref<string>) {
  const importError = ref('')
  const isDragging = ref(false)
  let dragDepth = 0

  async function importFile(file: File) {
    importError.value = ''

    if (!isMarkdownImportFile(file)) {
      importError.value = '仅支持 .md 和 .txt 文件'
      return
    }

    try {
      content.value = await readMarkdownImportFile(file)
    }
    catch {
      importError.value = '文件读取失败，请稍后重试'
    }
  }

  function onDragEnter(event: DragEvent) {
    event.preventDefault()
    dragDepth += 1
    isDragging.value = true
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault()
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0)
      isDragging.value = false
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer)
      event.dataTransfer.dropEffect = 'copy'
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault()
    dragDepth = 0
    isDragging.value = false

    const file = event.dataTransfer?.files.item(0)
    if (file)
      await importFile(file)
  }

  return {
    importError,
    isDragging,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  }
}

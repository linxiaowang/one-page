import { exportElementAsLongImage } from '~/utils/pageImageExport'

export function usePageImageExport() {
  const exporting = ref(false)
  const exportError = ref('')

  async function exportLongImage(
    source: HTMLElement | null | undefined,
    filename: string,
  ) {
    if (!source)
      return

    exporting.value = true
    exportError.value = ''

    try {
      await exportElementAsLongImage(source, { filename })
    }
    catch {
      exportError.value = '导出失败，请稍后重试'
    }
    finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportError,
    exportLongImage,
  }
}

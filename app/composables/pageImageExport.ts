import type { PageImageExportOptions } from '~/utils/pageImageExport'
import { exportElementAsLongImage, getResolvedBackground } from '~/utils/pageImageExport'

export function usePageImageExport() {
  const exporting = ref(false)
  const exportError = ref('')

  async function exportLongImage(
    source: HTMLElement | null | undefined,
    filename: string,
    options: Pick<PageImageExportOptions, 'backgroundColor' | 'padding'>,
  ) {
    if (!source)
      return

    exporting.value = true
    exportError.value = ''

    try {
      const backgroundColor = options.backgroundColor || getResolvedBackground(source, '#fafaf9')
      await exportElementAsLongImage(source, {
        filename,
        backgroundColor,
        padding: options.padding,
      })
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

import { domToPng } from 'modern-screenshot'
import { READING_EXPORT_BACKGROUND } from '~/constants/reading'

function sanitizeFilename(filename: string) {
  const cleaned = filename.replace(/[<>:"/\\|?*\n\r]/g, '_').trim()
  return cleaned || '一页'
}

export interface PageImageExportOptions {
  filename: string
}

async function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll('img')]
  await Promise.all(images.map((image) => {
    if (image.complete)
      return Promise.resolve()

    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => resolve(), { once: true })
    })
  }))
}

async function waitForPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function waitForStableLayout(root: HTMLElement) {
  let lastHeight = -1

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await waitForPaint()
    const height = root.scrollHeight
    if (height > 0 && height === lastHeight)
      return
    lastHeight = height
  }
}

export async function exportElementAsLongImage(
  source: HTMLElement,
  options: PageImageExportOptions,
) {
  await waitForPaint()
  await waitForStableLayout(source)
  await waitForImages(source)

  if (source.scrollHeight < 1)
    throw new Error('Export content is empty')

  const dataUrl = await domToPng(source, {
    backgroundColor: READING_EXPORT_BACKGROUND,
    scale: 2,
    width: source.scrollWidth,
    height: source.scrollHeight,
    style: {
      overflow: 'visible',
      width: `${source.scrollWidth}px`,
      height: `${source.scrollHeight}px`,
    },
  })

  const link = document.createElement('a')
  link.download = `${sanitizeFilename(options.filename)}.png`
  link.href = dataUrl
  link.click()
}

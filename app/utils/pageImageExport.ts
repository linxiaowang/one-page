import { toPng } from 'html-to-image'

const EXPORT_WIDTH_PX = 672

function sanitizeFilename(filename: string) {
  const cleaned = filename.replace(/[<>:"/\\|?*\n\r]/g, '_').trim()
  return cleaned || '一页'
}

export interface PageImageExportOptions {
  filename: string
  backgroundColor: string
  padding?: string
}

function resolveCssColor(value: string, fallback: string) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)')
    return fallback

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context)
    return fallback

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 1, 1)

  try {
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
  }
  catch {
    return fallback
  }

  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
  if (alpha === 0)
    return fallback

  return `rgb(${red}, ${green}, ${blue})`
}

function getLuminance(rgb: string) {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match)
    return 0.5

  const channels = match.slice(1, 4).map(value => Number(value) / 255).map((channel) => {
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function getFallbackTextColor(backgroundColor: string) {
  return getLuminance(backgroundColor) > 0.55 ? 'rgb(28, 25, 23)' : 'rgb(231, 229, 228)'
}

export function getResolvedBackground(element: HTMLElement, fallback: string) {
  let current: HTMLElement | null = element

  while (current) {
    const resolved = resolveCssColor(getComputedStyle(current).backgroundColor, 'transparent')
    if (resolved !== 'transparent')
      return resolved
    current = current.parentElement
  }

  return fallback
}

function inlineExportStyles(
  source: HTMLElement,
  clone: HTMLElement,
  textFallback: string,
) {
  const sourceNodes = [source, ...source.querySelectorAll<HTMLElement>('*')]
  const cloneNodes = [clone, ...clone.querySelectorAll<HTMLElement>('*')]

  for (let index = 0; index < sourceNodes.length; index += 1) {
    const sourceElement = sourceNodes[index]
    const cloneElement = cloneNodes[index]
    if (!sourceElement || !cloneElement)
      continue

    const styles = getComputedStyle(sourceElement)
    const backgroundColor = resolveCssColor(styles.backgroundColor, 'transparent')

    cloneElement.removeAttribute('class')
    for (const attribute of [...cloneElement.attributes]) {
      if (attribute.name.startsWith('data-v-'))
        cloneElement.removeAttribute(attribute.name)
    }

    cloneElement.style.color = resolveCssColor(styles.color, textFallback)
    cloneElement.style.backgroundColor = backgroundColor === 'transparent'
      ? 'transparent'
      : backgroundColor
    cloneElement.style.borderColor = resolveCssColor(styles.borderTopColor, 'transparent')
    cloneElement.style.fontFamily = styles.fontFamily
    cloneElement.style.fontSize = styles.fontSize
    cloneElement.style.fontWeight = styles.fontWeight
    cloneElement.style.fontStyle = styles.fontStyle
    cloneElement.style.lineHeight = styles.lineHeight
    cloneElement.style.textAlign = styles.textAlign
    cloneElement.style.textDecoration = styles.textDecoration
    cloneElement.style.margin = styles.margin
    cloneElement.style.padding = styles.padding
    cloneElement.style.display = styles.display
    cloneElement.style.listStyleType = styles.listStyleType
    cloneElement.style.listStylePosition = styles.listStylePosition
    cloneElement.style.whiteSpace = styles.whiteSpace
    cloneElement.style.wordBreak = styles.wordBreak
    cloneElement.style.overflowWrap = styles.overflowWrap
    cloneElement.style.borderWidth = styles.borderWidth
    cloneElement.style.borderStyle = styles.borderStyle
    cloneElement.style.borderRadius = styles.borderRadius
    cloneElement.style.contentVisibility = 'visible'
    cloneElement.style.contain = 'none'
    cloneElement.style.overflow = 'visible'
    cloneElement.style.maxHeight = 'none'
    cloneElement.style.height = 'auto'
    cloneElement.style.opacity = '1'
    cloneElement.style.visibility = 'visible'
  }
}

function createExportFrame(backgroundColor: string, padding: string, textColor: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${EXPORT_WIDTH_PX + 96}px`,
    height: '10000px',
    border: '0',
  })

  document.body.appendChild(iframe)

  const document_ = iframe.contentDocument
  if (!document_)
    throw new Error('Failed to create export frame')

  document_.open()
  document_.write(`<!DOCTYPE html><html><head><style>
    html, body {
      margin: 0;
      padding: 0;
      background: ${backgroundColor};
      color: ${textColor};
    }
  </style></head><body></body></html>`)
  document_.close()

  const shell = document_.createElement('div')
  shell.style.width = `${EXPORT_WIDTH_PX}px`
  shell.style.padding = padding
  shell.style.boxSizing = 'content-box'
  shell.style.backgroundColor = backgroundColor
  shell.style.color = textColor
  document_.body.appendChild(shell)

  return {
    document: document_,
    shell,
    destroy() {
      iframe.remove()
    },
  }
}

export async function exportElementAsLongImage(
  source: HTMLElement,
  options: PageImageExportOptions,
) {
  const backgroundColor = options.backgroundColor
  const padding = options.padding ?? '2.5rem 1.5rem 4rem'
  const textFallback = getFallbackTextColor(backgroundColor)
  const clone = source.cloneNode(true) as HTMLElement
  inlineExportStyles(source, clone, textFallback)

  const frame = createExportFrame(
    backgroundColor,
    padding,
    resolveCssColor(getComputedStyle(source).color, textFallback),
  )
  frame.shell.appendChild(frame.document.importNode(clone, true))

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    if (frame.shell.offsetHeight < 1)
      throw new Error('Export content is empty')

    const dataUrl = await toPng(frame.shell, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor,
    })

    const link = document.createElement('a')
    link.download = `${sanitizeFilename(options.filename)}.png`
    link.href = dataUrl
    link.click()
  }
  finally {
    frame.destroy()
  }
}

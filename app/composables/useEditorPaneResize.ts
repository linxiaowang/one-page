const SPLIT_MIN = 20
const SPLIT_MAX = 80
const LAYOUT_PADDING_PX = 12
const RESIZER_WIDTH_PX = 12

export function useEditorPaneResize(initialSplit = 50) {
  const split = ref(initialSplit)
  const layoutRef = ref<HTMLElement | null>(null)
  const isResizing = ref(false)
  let activeResizer: HTMLElement | null = null

  function onPointerMove(event: PointerEvent) {
    const layout = layoutRef.value
    if (!isResizing.value || !layout)
      return

    const rect = layout.getBoundingClientRect()
    const trackWidth = rect.width - LAYOUT_PADDING_PX * 2 - RESIZER_WIDTH_PX
    const offset = event.clientX - rect.left - LAYOUT_PADDING_PX
    const percent = (offset / trackWidth) * 100
    split.value = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, percent))
  }

  function stopResize(event: PointerEvent) {
    if (!isResizing.value)
      return

    isResizing.value = false
    document.body.style.removeProperty('user-select')
    document.body.style.removeProperty('cursor')

    if (activeResizer) {
      try {
        activeResizer.releasePointerCapture(event.pointerId)
      }
      catch {
        // pointer may already be released
      }
      activeResizer = null
    }

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', stopResize)
  }

  function startResize(event: PointerEvent) {
    if (event.button !== 0)
      return

    const target = event.currentTarget
    if (!(target instanceof HTMLElement))
      return

    isResizing.value = true
    activeResizer = target
    target.setPointerCapture(event.pointerId)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopResize)
    event.preventDefault()
  }

  onUnmounted(stopResize)

  const layoutStyle = computed(() => ({
    '--editor-split': `${split.value}%`,
  }))

  return {
    split,
    layoutRef,
    isResizing,
    layoutStyle,
    startResize,
  }
}

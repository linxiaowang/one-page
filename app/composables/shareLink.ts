import type { ReadingFont } from '~/constants/reading'
import { DEFAULT_READING_FONT } from '~/constants/reading'

function resolveShareId(query: Record<string, unknown>): string | null {
  const id = query.s
  if (typeof id !== 'string' || !id)
    return null
  return id
}

export function useShareLink(content: Ref<string>, font: Ref<ReadingFont>) {
  const copied = ref(false)
  const copyError = ref('')
  const sharing = ref(false)
  const isEditing = ref(false)

  const { copy, isSupported } = useClipboard()
  const route = useRoute()
  const requestFetch = useRequestFetch()
  const shareId = computed(() => resolveShareId(route.query))

  const { data: shareData, pending, error, refresh } = useAsyncData(
    () => (shareId.value ? `share:${shareId.value}` : 'share:none'),
    async () => {
      const id = shareId.value
      if (!id)
        return null

      return await requestFetch<{ content: string, font?: ReadingFont }>(`/api/share/${id}`)
    },
    { watch: [shareId] },
  )

  function applyShareData(data: { content: string, font?: ReadingFont } | null | undefined) {
    if (!data)
      return

    content.value = data.content
    font.value = data.font ?? DEFAULT_READING_FONT
    copyError.value = ''
  }

  applyShareData(shareData.value)

  watch(shareData, (data) => {
    applyShareData(data)
  })

  watch(error, (fetchError) => {
    if (!shareId.value || !fetchError)
      return

    copyError.value = '分享链接无效或已过期'
  }, { immediate: true })

  const isSharedView = computed(() => Boolean(shareId.value && !error.value))
  const loading = computed(() => Boolean(shareId.value && pending.value))
  const showEditor = computed(() => !isSharedView.value || isEditing.value)

  function enterEdit() {
    isEditing.value = true
  }

  async function copyShareLink() {
    copyError.value = ''

    if (!content.value.trim())
      return

    if (!isSupported.value) {
      copyError.value = '当前浏览器不支持复制'
      return
    }

    sharing.value = true

    try {
      const { id } = await $fetch<{ id: string }>('/api/share', {
        method: 'POST',
        body: {
          content: content.value,
          font: font.value,
        },
      })

      const url = `${window.location.origin}${window.location.pathname}?s=${id}`
      await copy(url)
      copied.value = true
      window.setTimeout(() => {
        copied.value = false
      }, 2000)
    }
    catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { statusMessage?: string } }).data?.statusMessage
        : undefined
      copyError.value = message || '生成分享链接失败，请稍后重试'
    }
    finally {
      sharing.value = false
    }
  }

  return {
    copied,
    copyError,
    loading,
    sharing,
    isSharedView,
    shareData,
    shareId,
    showEditor,
    copyShareLink,
    enterEdit,
    refreshShare: refresh,
  }
}

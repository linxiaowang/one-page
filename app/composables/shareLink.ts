import type { ReadingFont } from '~/constants/reading'
import { DEFAULT_READING_FONT } from '~/constants/reading'

export function useShareLink(content: Ref<string>, font: Ref<ReadingFont>) {
  const copied = ref(false)
  const copyError = ref('')
  const loading = ref(false)
  const sharing = ref(false)
  const isSharedView = ref(false)
  const isEditing = ref(false)

  const { copy, isSupported } = useClipboard()
  const route = useRoute()

  const showEditor = computed(() => !isSharedView.value || isEditing.value)

  async function loadFromUrl() {
    const id = route.query.s
    if (!id || Array.isArray(id))
      return

    loading.value = true
    copyError.value = ''
    isSharedView.value = true
    isEditing.value = false

    try {
      const data = await $fetch<{ content: string, font?: ReadingFont }>(`/api/share/${id}`)
      content.value = data.content
      font.value = data.font ?? DEFAULT_READING_FONT
    }
    catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { statusMessage?: string } }).data?.statusMessage
        : undefined
      copyError.value = message || '分享链接无效或已过期'
      isSharedView.value = false
    }
    finally {
      loading.value = false
    }
  }

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
    showEditor,
    copyShareLink,
    enterEdit,
    loadFromUrl,
  }
}

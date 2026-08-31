export function useShareLink(content: Ref<string>) {
  const copied = ref(false)
  const copyError = ref('')
  const loading = ref(false)
  const sharing = ref(false)

  const { copy, isSupported } = useClipboard()
  const route = useRoute()

  async function loadFromUrl() {
    const id = route.query.s
    if (!id || Array.isArray(id))
      return

    loading.value = true
    copyError.value = ''

    try {
      const data = await $fetch<{ content: string }>(`/api/share/${id}`)
      content.value = data.content
    }
    catch {
      copyError.value = '分享链接无效或已过期'
    }
    finally {
      loading.value = false
    }
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
        body: { content: content.value },
      })

      const url = `${window.location.origin}${window.location.pathname}?s=${id}`
      await copy(url)
      history.replaceState(null, '', `?s=${id}`)
      copied.value = true
      window.setTimeout(() => {
        copied.value = false
      }, 2000)
    }
    catch {
      copyError.value = '生成分享链接失败，请稍后重试'
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
    copyShareLink,
    loadFromUrl,
  }
}

<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

definePageMeta({
  layout: 'home',
})

const content = ref('')
const hasContent = computed(() => content.value.trim().length > 0)

const {
  copied,
  copyError,
  loading,
  sharing,
  isSharedView,
  showEditor,
  copyShareLink,
  enterEdit,
  loadFromUrl,
} = useShareLink(content)

const isReadingView = computed(() => isSharedView.value && !showEditor.value)

watch(isReadingView, (reading) => {
  if (!import.meta.client)
    return
  document.documentElement.classList.toggle('reading-mode', reading)
  document.body.classList.toggle('reading-mode', reading)
}, { immediate: true })

onUnmounted(() => {
  if (!import.meta.client)
    return
  document.documentElement.classList.remove('reading-mode')
  document.body.classList.remove('reading-mode')
})

onMounted(() => {
  loadFromUrl()
})
</script>

<template>
  <div
    class="flex flex-col h-screen"
    :class="isReadingView ? 'bg-stone-50 dark:bg-stone-950' : ''"
  >
    <header
      class="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200 dark:border-gray-700"
      :class="isReadingView ? 'border-b-transparent bg-transparent' : ''"
    >
      <span class="text-sm font-medium text-teal-800 dark:text-teal-300">one-page</span>
      <div class="flex items-center gap-2">
        <span v-if="copyError" class="text-xs text-red-500">{{ copyError }}</span>
        <button
          v-if="isSharedView && !showEditor && hasContent"
          type="button"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
          @click="enterEdit"
        >
          编辑
        </button>
        <button
          v-if="showEditor"
          type="button"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
          :disabled="!hasContent || sharing"
          @click="copyShareLink"
        >
          {{ copied ? '已复制' : sharing ? '生成中…' : '复制分享链接' }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex flex-1 items-center justify-center text-gray-400">
      加载中…
    </div>

    <div v-else-if="showEditor" class="flex flex-1 min-h-0 gap-3 p-3">
      <textarea
        v-model="content"
        class="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-md h-full w-full resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        placeholder="在这里粘贴或输入 Markdown…"
      />
      <div class="relative border-2 border-gray-300 dark:border-gray-600 rounded-md h-full w-full overflow-hidden bg-white dark:bg-gray-900">
        <div
          v-if="!hasContent"
          class="absolute inset-0 flex items-center justify-center p-8 text-center text-gray-400 dark:text-gray-500"
        >
          <p class="max-w-xs text-base leading-relaxed">
            这是一页。把内容贴在左边，右边会出预览。
          </p>
        </div>
        <MarkdownRender
          v-else
          class="p-6 scroll-smooth h-full w-full overflow-y-auto"
          :content="content"
          final
        />
      </div>
    </div>

    <div v-else class="reading-page flex flex-1 min-h-0 overflow-y-auto bg-stone-50 dark:bg-stone-950">
      <article v-if="hasContent" class="reading-article">
        <MarkdownRender
          class="reading-content text-stone-900 dark:text-stone-200"
          :content="content"
          final
        />
      </article>
    </div>
  </div>
</template>

<style scoped>
.reading-article {
  box-sizing: content-box;
  width: 100%;
  max-width: 42rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

@media (min-width: 640px) {
  .reading-article {
    padding: 3.5rem 2rem 5rem;
  }
}

.reading-content {
  --ms-text-body: 1.125rem;
  --ms-leading-body: 1.85;
  --ms-text-h1: 2rem;
  --ms-text-h2: 1.5rem;
  --ms-text-h3: 1.25rem;
  --ms-leading-h1: 1.3;
  --ms-leading-h2: 1.4;
  --ms-flow-paragraph-y: 1.1em;
  --ms-flow-heading-2-mt: 2.25em;
  --ms-flow-heading-3-mt: 1.75em;
  --ms-flow-hr-y: 2.75em;
}
</style>

<style>
html.reading-mode,
html.reading-mode body {
  background-color: #fafaf9;
}

html.dark.reading-mode,
html.dark.reading-mode body {
  background-color: #0c0a09;
}
</style>

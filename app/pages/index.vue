<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'
import '~/assets/reading-export.css'
import type { ReadingFont } from '~/constants/reading'
import { DEFAULT_READING_FONT, READING_EXPORT_SURFACE_WIDTH } from '~/constants/reading'
import { appName } from '~/constants'
import { resolvePageTitleFromMarkdown } from '~/utils/markdownTitle'

definePageMeta({
  layout: 'home',
})

const content = ref('')
const readingFont = ref<ReadingFont>(DEFAULT_READING_FONT)
const hasContent = computed(() => content.value.trim().length > 0)
const contentFontClass = computed(() =>
  readingFont.value === 'songti' ? 'content-font--songti' : 'content-font--heiti',
)

const {
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
} = useShareLink(content, readingFont)

const { exporting, exportError, exportLongImage } = usePageImageExport()
const exportSourceRef = ref<HTMLElement | null>(null)

const isReadingView = computed(() => isSharedView.value && !showEditor.value)

async function downloadPageImage() {
  copyError.value = ''
  exportError.value = ''
  await nextTick()
  await nextTick()

  if (!exportSourceRef.value)
    return

  await exportLongImage(
    exportSourceRef.value,
    resolvePageTitleFromMarkdown(content.value),
  )
}

const pageTitle = computed(() => {
  if (!shareId.value || showEditor.value)
    return appName

  const markdown = shareData.value?.content ?? content.value
  return resolvePageTitleFromMarkdown(markdown)
})

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  twitterTitle: pageTitle,
})

const readingPageRef = ref<HTMLElement | null>(null)
const showReadingChrome = ref(true)
const { y, directions } = useScroll(readingPageRef)
let readingChromeTimer: ReturnType<typeof setTimeout> | undefined

function scheduleReadingChromeHide() {
  clearTimeout(readingChromeTimer)
  readingChromeTimer = setTimeout(() => {
    if (isReadingView.value && y.value < 32)
      showReadingChrome.value = false
  }, 2400)
}

watch(isReadingView, (reading) => {
  if (reading) {
    showReadingChrome.value = true
    scheduleReadingChromeHide()
  }
  else {
    clearTimeout(readingChromeTimer)
  }

  if (!import.meta.client)
    return
  document.documentElement.classList.toggle('reading-mode', reading)
  document.body.classList.toggle('reading-mode', reading)
}, { immediate: true })

watch([y, () => directions.top, () => directions.bottom], () => {
  if (!isReadingView.value)
    return

  if (y.value < 32) {
    showReadingChrome.value = true
    scheduleReadingChromeHide()
    return
  }

  if (directions.bottom)
    showReadingChrome.value = false
  else if (directions.top)
    showReadingChrome.value = true
})

function revealReadingChrome(event: MouseEvent) {
  if (!isReadingView.value)
    return

  if (event.clientY <= 56)
    showReadingChrome.value = true
}

onUnmounted(() => {
  clearTimeout(readingChromeTimer)
  if (!import.meta.client)
    return
  document.documentElement.classList.remove('reading-mode')
  document.body.classList.remove('reading-mode')
})
</script>

<template>
  <div
    class="flex flex-col h-screen"
    :class="isReadingView ? 'bg-stone-50 dark:bg-stone-950' : ''"
  >
    <header
      v-if="!isReadingView"
      class="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200 dark:border-gray-700"
    >
      <span class="app-brand font-brand">{{ appName }}</span>
      <div class="flex items-center gap-2">
        <span v-if="copyError || exportError" class="text-xs text-red-500">{{ copyError || exportError }}</span>
        <button
          v-if="showEditor"
          type="button"
          class="font-toggle font-toggle--songti"
          :class="{ 'font-toggle--active': readingFont === 'songti' }"
          @click="readingFont = 'songti'"
        >
          宋体
        </button>
        <button
          v-if="showEditor"
          type="button"
          class="font-toggle font-toggle--heiti"
          :class="{ 'font-toggle--active': readingFont === 'heiti' }"
          @click="readingFont = 'heiti'"
        >
          黑体
        </button>
        <button
          v-if="showEditor && hasContent"
          type="button"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
          :disabled="exporting || sharing"
          @click="downloadPageImage"
        >
          {{ exporting ? '导出中…' : '导出长图' }}
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

    <div v-else-if="showEditor" class="editor-layout flex flex-1 min-h-0 flex-col sm:flex-row gap-3 p-3">
      <textarea
        v-model="content"
        class="editor-input p-4 border-2 border-gray-300 dark:border-gray-600 rounded-md min-h-0 flex-1 w-full resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 sm:h-full"
        placeholder="在这里粘贴或输入 Markdown…"
      />
      <div class="editor-preview relative border-2 border-gray-300 dark:border-gray-600 rounded-md min-h-0 flex-1 w-full overflow-hidden bg-white dark:bg-gray-900 sm:h-full">
        <div
          v-if="!hasContent"
          class="absolute inset-0 flex items-center justify-center p-8 text-center text-gray-400 dark:text-gray-500"
        >
          <p class="max-w-xs text-base leading-relaxed">
            这是一页。输入内容后，下面会出预览。
          </p>
        </div>
        <div
          v-else
          class="p-6 scroll-smooth h-full w-full overflow-y-auto"
        >
          <div
            class="reading-content text-stone-900 dark:text-stone-200 content-font"
            :class="contentFontClass"
          >
            <MarkdownRender
              :content="content"
              final
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      ref="readingPageRef"
      class="reading-page flex flex-1 min-h-0 overflow-y-auto bg-stone-50 dark:bg-stone-950"
      @pointermove="revealReadingChrome"
    >
      <div
        class="reading-chrome"
        :class="{ 'reading-chrome--visible': showReadingChrome }"
      >
        <button
          v-if="hasContent"
          type="button"
          class="reading-chrome__action"
          @click="enterEdit"
        >
          编辑
        </button>
      </div>

      <article v-if="hasContent" class="reading-article">
        <div
          class="reading-content text-stone-900 dark:text-stone-200 content-font"
          :class="contentFontClass"
        >
          <MarkdownRender
            :content="content"
            final
          />
        </div>
      </article>
    </div>

    <div
      v-if="hasContent"
      class="page-export-source"
      aria-hidden="true"
    >
      <article ref="exportSourceRef" class="reading-article reading-article--export">
        <div
          class="reading-content text-stone-900 content-font"
          :class="contentFontClass"
        >
          <MarkdownRender
            :content="content"
            final
          />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.app-brand {
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgb(28 25 23);
}

html.dark .app-brand {
  color: rgb(245 245 244);
}

.font-toggle {
  border: 0;
  background: transparent;
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(120 113 108 / 0.75);
  cursor: pointer;
  transition: color 0.15s ease;
}

.font-toggle--active {
  color: rgb(15 118 110);
}

.font-toggle--songti {
  font-family: 'Songti SC', 'STSong', 'SimSun', serif;
}

.font-toggle--heiti {
  font-family: 'PingFang SC', 'Heiti SC', 'Microsoft YaHei', sans-serif;
}

html.dark .font-toggle {
  color: rgb(168 162 158 / 0.7);
}

html.dark .font-toggle--active {
  color: rgb(94 234 212);
}

.reading-chrome {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  max-width: 42rem;
  padding: 0.875rem 1.5rem;
  transform: translateX(-50%) translateY(calc(-100% - 0.5rem));
  opacity: 0;
  pointer-events: none;
  transition:
    transform 0.28s ease,
    opacity 0.28s ease;
}

.reading-chrome--visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.reading-chrome__action {
  border: 0;
  background: transparent;
  margin-left: auto;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: rgb(120 113 108 / 0.45);
  cursor: pointer;
  transition: color 0.15s ease;
}

.reading-chrome__action:hover {
  color: rgb(120 113 108 / 0.72);
}

html.dark .reading-chrome__action {
  color: rgb(168 162 158 / 0.42);
}

html.dark .reading-chrome__action:hover {
  color: rgb(168 162 158 / 0.68);
}

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

  .reading-chrome {
    padding-inline: 2rem;
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

.content-font--heiti {
  --ms-font-sans: 'PingFang SC', 'Heiti SC', 'Microsoft YaHei', sans-serif;
}

.content-font--songti {
  --ms-font-sans: 'Songti SC', 'STSong', 'SimSun', serif;
}

.editor-layout {
  overflow: hidden;
}

@media (max-width: 639px) {
  .editor-layout {
    overflow-y: auto;
  }

  .editor-input {
    min-height: 42vh;
    flex: 0 0 auto;
  }

  .editor-preview {
    min-height: 42vh;
    flex: 0 0 auto;
  }
}

.page-export-source {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  width: v-bind(READING_EXPORT_SURFACE_WIDTH);
  opacity: 0;
  pointer-events: none;
  background-color: #fafaf9;
  overflow: visible;
}

.reading-article--export {
  width: 100%;
  max-width: 42rem;
  margin: 0;
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

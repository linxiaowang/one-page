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
const {
  importError,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
} = useMarkdownFileImport(content)
const {
  layoutRef: editorLayoutRef,
  isResizing: isResizingEditorPane,
  layoutStyle: editorLayoutStyle,
  startResize: startEditorPaneResize,
} = useEditorPaneResize()
const exportSourceRef = ref<HTMLElement | null>(null)

const isReadingView = computed(() => isSharedView.value && !showEditor.value)

async function downloadPageImage() {
  copyError.value = ''
  exportError.value = ''
  importError.value = ''
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
      class="editor-header flex flex-col gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <span class="app-brand font-brand shrink-0">{{ appName }}</span>
      <div class="editor-header__actions flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
        <span v-if="copyError || exportError || importError" class="editor-header__error w-full text-xs text-red-500 sm:w-auto">{{ copyError || exportError || importError }}</span>
        <div class="editor-header__toolbar flex w-full items-center justify-between gap-x-2 sm:w-auto sm:justify-end sm:gap-2">
          <div class="editor-header__fonts flex items-center gap-x-2 sm:contents">
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
          </div>
          <div class="editor-header__tools flex shrink-0 items-center gap-x-2 sm:contents">
            <button
              v-if="showEditor && hasContent"
              type="button"
              class="editor-header__action px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
              :disabled="exporting || sharing"
              @click="downloadPageImage"
            >
              <span class="sm:hidden">{{ exporting ? '导出中' : '导出' }}</span>
              <span class="hidden sm:inline">{{ exporting ? '导出中…' : '导出长图' }}</span>
            </button>
            <button
              v-if="showEditor"
              type="button"
              class="editor-header__action px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
              :disabled="!hasContent || sharing"
              @click="copyShareLink"
            >
              <span class="sm:hidden">{{ copied ? '已复制' : sharing ? '生成中' : '复制' }}</span>
              <span class="hidden sm:inline">{{ copied ? '已复制' : sharing ? '生成中…' : '复制分享链接' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="flex flex-1 items-center justify-center text-gray-400">
      加载中…
    </div>

    <div
      v-else-if="showEditor"
      ref="editorLayoutRef"
      class="editor-layout relative flex flex-1 min-h-0 flex-col gap-3 p-3 sm:flex-row sm:gap-0"
      :class="{
        'editor-layout--dragging': isDragging,
        'editor-layout--resizing': isResizingEditorPane,
      }"
      :style="editorLayoutStyle"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <div class="editor-input-shell relative flex min-h-0 w-full flex-1 flex-col sm:h-full">
        <textarea
          v-model="content"
          class="editor-input min-h-0 w-full flex-1 resize-none rounded-md border-2 border-gray-300 bg-white p-4 pb-9 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          placeholder="在这里粘贴或输入 Markdown…"
        />
        <p
          v-if="!hasContent"
          class="editor-import-hint pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-gray-400 dark:text-gray-500"
        >
          支持拖入 .md / .txt 文件导入
        </p>
      </div>
      <div
        class="editor-resizer hidden sm:block"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整编辑区和预览区宽度"
        @pointerdown="startEditorPaneResize"
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

@media (max-width: 639px) {
  .editor-header {
    flex-shrink: 0;
    padding-block: 0.5rem;
  }

  .editor-header__action {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1.25rem;
  }

  .font-toggle {
    font-size: 0.8125rem;
  }
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

.content-font--heiti :deep(.markstream-vue) {
  --ms-font-sans: 'PingFang SC', 'Heiti SC', 'Microsoft YaHei', sans-serif;
  font-family: var(--ms-font-sans);
}

.content-font--songti {
  --ms-font-sans: 'Songti SC', 'STSong', 'SimSun', serif;
}

.content-font--songti :deep(.markstream-vue) {
  --ms-font-sans: 'Songti SC', 'STSong', 'SimSun', serif;
  font-family: var(--ms-font-sans);
}

.editor-layout {
  overflow: hidden;
}

@media (min-width: 640px) {
  .editor-input-shell {
    flex: 0 0 var(--editor-split, 50%);
    min-width: 0;
  }

  .editor-preview {
    flex: 1 1 0;
    min-width: 0;
  }
}

.editor-resizer {
  position: relative;
  flex: 0 0 12px;
  align-self: stretch;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
}

.editor-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  border-radius: 9999px;
  background: transparent;
  transform: translateX(-50%);
  transition: background-color 0.15s ease;
  pointer-events: none;
}

.editor-resizer:hover::after,
.editor-layout--resizing .editor-resizer::after {
  background: rgb(15 118 110 / 0.35);
}

html.dark .editor-resizer:hover::after,
html.dark .editor-layout--resizing .editor-resizer::after {
  background: rgb(94 234 212 / 0.35);
}

.editor-layout--resizing,
.editor-layout--resizing * {
  cursor: col-resize !important;
}

.editor-layout--dragging::after {
  content: '松开以导入 .md / .txt';
  position: absolute;
  inset: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgb(15 118 110 / 0.55);
  border-radius: 0.375rem;
  background: rgb(240 253 250 / 0.92);
  color: rgb(15 118 110);
  font-size: 0.875rem;
  pointer-events: none;
}

html.dark .editor-layout--dragging::after {
  border-color: rgb(94 234 212 / 0.55);
  background: rgb(4 47 46 / 0.92);
  color: rgb(94 234 212);
}

@media (max-width: 639px) {
  .editor-layout {
    overflow-y: auto;
  }

  .editor-input-shell {
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

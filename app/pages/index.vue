<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'
import type { ReadingFont } from '~/constants/reading'
import { DEFAULT_READING_FONT } from '~/constants/reading'
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

const isReadingView = computed(() => isSharedView.value && !showEditor.value)

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
          class="p-6 scroll-smooth h-full w-full overflow-y-auto content-font"
          :class="contentFontClass"
          :content="content"
          final
        />
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
        <div class="flex items-center gap-2 ml-auto">
          <span v-if="copyError" class="text-xs text-red-500">{{ copyError }}</span>
          <button
            v-if="hasContent"
            type="button"
            class="reading-chrome__action"
            @click="enterEdit"
          >
            编辑
          </button>
        </div>
      </div>

      <article v-if="hasContent" class="reading-article">
        <MarkdownRender
          class="reading-content text-stone-900 dark:text-stone-200 content-font"
          :class="contentFontClass"
          :content="content"
          final
        />
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
  background: linear-gradient(
    to bottom,
    rgb(250 250 249 / 0.94) 0%,
    rgb(250 250 249 / 0.72) 55%,
    rgb(250 250 249 / 0) 100%
  );
}

html.dark .reading-chrome--visible {
  background: linear-gradient(
    to bottom,
    rgb(12 10 9 / 0.94) 0%,
    rgb(12 10 9 / 0.72) 55%,
    rgb(12 10 9 / 0) 100%
  );
}

.reading-chrome__action {
  border: 0;
  background: transparent;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: rgb(120 113 108 / 0.8);
  cursor: pointer;
  transition: color 0.15s ease;
}

.reading-chrome__action:hover {
  color: rgb(41 37 36);
}

html.dark .reading-chrome__action {
  color: rgb(168 162 158 / 0.75);
}

html.dark .reading-chrome__action:hover {
  color: rgb(231 229 228);
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

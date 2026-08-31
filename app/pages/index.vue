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

onMounted(() => {
  loadFromUrl()
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <header class="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
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

    <div v-else class="flex flex-1 min-h-0 p-3">
      <div class="border-2 border-gray-300 dark:border-gray-600 rounded-md h-full w-full overflow-hidden bg-white dark:bg-gray-900">
        <MarkdownRender
          v-if="hasContent"
          class="p-6 scroll-smooth h-full w-full overflow-y-auto"
          :content="content"
          final
        />
      </div>
    </div>
  </div>
</template>

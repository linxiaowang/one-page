<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

definePageMeta({
  layout: 'home',
})

const content = ref('')
const hasContent = computed(() => content.value.trim().length > 0)
</script>

<template>
  <div class="flex h-screen gap-3 p-3">
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
</template>

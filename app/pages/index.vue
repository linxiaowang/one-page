<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

definePageMeta({
  layout: 'home',
})

const content = ref('')
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <textarea v-model="content" class="p-2 border-2 border-gray-300 rounded-md h-full w-full" type="textarea" placeholder="Enter..." />
    <MarkdownRender class="p-6 scroll-smooth border-2 border-gray-300 rounded-md h-full w-full overflow-y-auto" :content="content" final />
  </div>
</template>

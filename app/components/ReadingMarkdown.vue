<script setup lang="ts">
import MarkdownRender from 'markstream-vue'
import { normalizeMarkdownForRender } from '~/utils/markdownNormalize'

const props = withDefaults(defineProps<{
  content: string
  final?: boolean
}>(), {
  final: true,
})

const rootRef = ref<HTMLElement | null>(null)

const renderedContent = computed(() => normalizeMarkdownForRender(props.content))

function patchImages() {
  const root = rootRef.value
  if (!root)
    return

  for (const image of root.querySelectorAll('img')) {
    if (image.referrerPolicy !== 'no-referrer')
      image.referrerPolicy = 'no-referrer'

    if (image.complete && image.naturalWidth === 0 && image.src) {
      const src = image.src
      image.removeAttribute('src')
      image.src = src
    }
  }
}

watch(renderedContent, async () => {
  await nextTick()
  patchImages()
}, { flush: 'post' })

onMounted(() => {
  patchImages()
})
</script>

<template>
  <div ref="rootRef" class="reading-markdown">
    <MarkdownRender
      :content="renderedContent"
      :final="final"
    />
  </div>
</template>

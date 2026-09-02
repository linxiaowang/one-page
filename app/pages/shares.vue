<script setup lang="ts">
import { appName } from '~/constants'

definePageMeta({
  layout: 'home',
})

interface ShareListItem {
  id: string
  title: string
  createdAt: number
  expiresAt: number
}

const { loggedIn, user, ready, clear } = useUserSession()
const { copy, isSupported } = useClipboard()
const copiedId = ref<string | null>(null)

const { data, pending, error, refresh } = await useFetch<{ shares: ShareListItem[] }>('/api/share/mine', {
  immediate: false,
  default: () => ({ shares: [] }),
})

watch([ready, loggedIn], ([sessionReady, isLoggedIn]) => {
  if (sessionReady && isLoggedIn)
    refresh()
}, { immediate: true })

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function shareUrl(id: string) {
  if (import.meta.client)
    return `${window.location.origin}/?s=${id}`

  return `/?s=${id}`
}

async function copyShareLink(id: string) {
  if (!isSupported.value)
    return

  await copy(shareUrl(id))
  copiedId.value = id
  window.setTimeout(() => {
    if (copiedId.value === id)
      copiedId.value = null
  }, 2000)
}

useSeoMeta({
  title: `我的分享 · ${appName}`,
})
</script>

<template>
  <div class="shares-page flex min-h-screen flex-col bg-white dark:bg-gray-950">
    <header class="shares-page__header flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <div class="flex min-w-0 items-center gap-3">
        <NuxtLink
          to="/"
          class="shares-page__back text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          返回编辑
        </NuxtLink>
        <h1 class="truncate text-base font-medium text-gray-900 dark:text-gray-100">
          我的分享
        </h1>
      </div>
      <div v-if="loggedIn && user" class="flex shrink-0 items-center gap-2">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.login"
          class="h-7 w-7 rounded-full"
        >
        <span class="hidden text-sm text-gray-600 dark:text-gray-300 sm:inline">{{ user.name || user.login }}</span>
        <button
          type="button"
          class="rounded-md px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          @click="clear"
        >
          退出
        </button>
      </div>
    </header>

    <main class="shares-page__main mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div v-if="!ready || pending" class="py-16 text-center text-gray-400">
        加载中…
      </div>

      <div
        v-else-if="!loggedIn"
        class="shares-page__empty rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700"
      >
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          登录后可查看自己创建过的分享链接。
        </p>
        <a
          href="/auth/github"
          class="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-900"
        >
          使用 GitHub 登录
        </a>
      </div>

      <div
        v-else-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        加载分享列表失败，请稍后重试。
      </div>

      <div
        v-else-if="!data?.shares.length"
        class="shares-page__empty rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700"
      >
        <p class="mb-2 text-gray-700 dark:text-gray-200">
          还没有分享记录
        </p>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          登录后复制分享链接，会在这里自动收录。
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center rounded-md border border-teal-700 px-4 py-2 text-sm text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
        >
          去写一篇
        </NuxtLink>
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="share in data.shares"
          :key="share.id"
          class="shares-page__item rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <NuxtLink
                :to="`/?s=${share.id}`"
                class="block truncate text-base font-medium text-gray-900 transition-colors hover:text-teal-700 dark:text-gray-100 dark:hover:text-teal-300"
              >
                {{ share.title }}
              </NuxtLink>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                创建于 {{ formatDate(share.createdAt) }} · {{ formatDate(share.expiresAt) }} 过期
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                @click="copyShareLink(share.id)"
              >
                {{ copiedId === share.id ? '已复制' : '复制链接' }}
              </button>
              <NuxtLink
                :to="`/?s=${share.id}`"
                class="rounded-md border border-teal-700 px-3 py-1.5 text-sm text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
              >
                打开
              </NuxtLink>
            </div>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

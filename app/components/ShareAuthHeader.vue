<script setup lang="ts">
const { loggedIn, user, ready, clear } = useUserSession()
</script>

<template>
  <div v-if="ready" class="share-auth-header flex items-center gap-2">
    <template v-if="loggedIn && user">
      <NuxtLink
        to="/shares"
        class="share-auth-header__link flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950"
      >
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.login"
          class="h-5 w-5 rounded-full"
        >
        <span class="max-w-24 truncate sm:max-w-none">我的分享</span>
      </NuxtLink>
      <button
        type="button"
        class="share-auth-header__logout rounded-md px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        @click="clear"
      >
        退出
      </button>
    </template>
    <a
      v-else
      href="/auth/github"
      class="share-auth-header__login rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      登录
    </a>
  </div>
</template>

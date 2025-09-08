<script setup lang="ts">
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { useAppStore } from '@/store'

const appStore = useAppStore()
</script>

<template>
  <n-config-provider
    wh-full
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined"
  >
    <n-global-style />
    <router-view v-slot="{ Component, route: curRoute }">
      <component :is="Component" :key="curRoute.fullPath" />
    </router-view>
  </n-config-provider>
</template>

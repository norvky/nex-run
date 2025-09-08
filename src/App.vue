<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { ref } from 'vue'
import { useTauriPluginLog } from '@/composables/use-tauri-plugin-log'
import { useAppStore } from '@/store'

const { isLogAttached, logError } = useTauriPluginLog()
const appStore = useAppStore()

const greetMsg = ref('')
const name = ref('')

const { x: mouseX, y: mouseY } = useMouse()

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  info('Invoking greet command')
  greetMsg.value = await invoke('greet', { name: name.value })
}

function close() {
  // Handle click outside
}
</script>

<template>
  <n-config-provider
    wh-full
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined"
  >
    <main class="container" wh-full>
      <h1 class="text-(4xl center gray-500) font-600">
        Welcome to Tauri + Vue
      </h1>

      <n-space justify="center">
        <a href="https://vitejs.dev" target="_blank">
          <img
            src="/vite.svg"
            class="logo"
            alt="Vite logo"
            hover="filter-drop-shadow-[0_0_2em_#747bff]"
          >
        </a>
        <a href="https://tauri.app" target="_blank">
          <img
            src="/tauri.svg"
            class="logo"
            alt="Tauri logo"
            hover="filter-drop-shadow-[0_0_2em_#249b73]"
          >
        </a>
        <a href="https://vuejs.org/" target="_blank">
          <img
            src="./assets/vue.svg"
            class="logo"
            alt="Vue logo"
            hover="filter-drop-shadow-[0_0_2em_#249b73]"
          >
        </a>
      </n-space>
      <p flex="~ justify-center">
        Click on the Tauri, Vite, and Vue logos to learn more.
      </p>

      <form flex="~ justify-center" @submit.prevent="greet">
        <n-space>
          <n-input v-model:value="name" size="large" placeholder="Enter a name..." />
          <n-button attr-type="submit" size="large" type="primary">
            Greet
          </n-button>
        </n-space>
      </form>
      <p>{{ greetMsg }}</p>

      <div>
        <n-button icon-placement="left">
          <template #icon>
            <n-icon><span i-mdi-alarm /></n-icon>
          </template>
          Button
        </n-button>
        <h3>Mouse: {{ mouseX }} x {{ mouseY }}</h3>
        <OnClickOutside @trigger="close">
          <div style="border: 1px solid black;">
            Click Outside of Me
          </div>
        </OnClickOutside>
      </div>

      <div p="x-2 y-4">
        <n-checkbox v-model:checked="appStore.isDark">
          Dark Mode
        </n-checkbox>
      </div>

      <div p="x-2 y-4">
        <p v-if="isLogAttached" c="green">
          Tauri plugin log is attached.
        </p>
        <p v-else-if="logError" c="red">
          Connection failed: {{ logError.message }}
        </p>
        <p v-else c="gray">
          Connecting to Tauri plugin log...
        </p>
      </div>
    </main>
    <n-global-style />
  </n-config-provider>
</template>

<style>
.logo {
  --at-apply: h-6em p-1.5em will-change-filter transition-75;
}
</style>

import type { PluginOption } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  NaiveUiResolver,
  VueUseComponentsResolver,
} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import vueInspector from 'vite-plugin-vue-inspector'

const host = process.env.TAURI_DEV_HOST

function pathResolve(dir: string): string {
  return resolve(__dirname, '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vueInspector(),

    UnoCSS() as PluginOption,

    // 自动引入 Vue Composition API & VueUse 等常用函数
    AutoImport({
      imports: [
        'vue',
        // 'vue-router',
        '@vueuse/core',
        'pinia',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
        },
      ],
      dts: true,
      eslintrc: {
        enabled: true, // 自动添加 ESLint globals
        filepath: './.eslintrc-auto-import.json',
      },
    }),

    // 自动按需引入组件
    Components({
      dirs: ['src/components'], // 自定义组件目录
      extensions: ['vue'],
      deep: true,
      dts: true,
      resolvers: [
        NaiveUiResolver(),
        VueUseComponentsResolver(),
      ],
    }),
  ],

  resolve: {
    alias: {
      '@': pathResolve('src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
})

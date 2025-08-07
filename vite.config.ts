import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from 'unplugin-auto-import/vite'
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { createIconComponentResolver, ViteIconCacheHMR } from './vicons-component-resolver'

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),

    // 自动引入 Vue Composition API & VueUse 等常用函数
    AutoImport({
      imports: [
        'vue',
        // 'vue-router',
        // '@vueuse/core',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      resolvers: [
        NaiveUiResolver(),
        IconsResolver(),
      ],
      eslintrc: {
        enabled: true, // 自动添加 ESLint globals
        filepath: './.eslintrc-auto-import.json',
      }
    }),

    // 自动按需引入组件
    Components({
      dirs: ['src/components'], // 自定义组件目录
      extensions: ['vue'],
      deep: true,
      dts: 'src/components.d.ts',
      resolvers: [
        NaiveUiResolver(),
        IconsResolver({
          prefix: 'icon',
        }),
        createIconComponentResolver({
          debug: {
            list: true,
            limit: 1,
            // find: ['AntdAndroidFilled', 'FluentAlbum24Regular']
          }
        }),
      ],
    }),

    // Icon 自动引入
    Icons({
      autoInstall: true,
    }),

    // 开发模式下监听图标包目录变动，自动清空缓存
    ViteIconCacheHMR(),
  ],

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
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));

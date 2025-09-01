import { attachConsole } from '@tauri-apps/plugin-log' // 引入 ref 用于状态管理（可选）

const isDev = import.meta.env.DEV

/**
 * Vue Composable，用于在组件挂载时将 Tauri 后端日志连接到浏览器控制台，
 * 并在组件卸载时自动分离
 *
 * - **日志行为**:
 *   - **开发环境**: 使用 `console.log` 记录连接和分离状态，便于调试。
 *   - **生产环境**: 禁用 `console.log`，以符合 ESLint 规则
 *     （例如 `Unexpected console statement`）并减少不必要的控制台输出。
 * - **错误处理**: 任何连接失败的错误，无论环境，都会通过 `console.error` 记录，
 *   并存储在 `logError` Ref 中。
 *
 * @returns {{ isLogAttached: Ref<boolean>, logError: Ref<Error | null> }}
 *   一个包含响应式状态的对象：
 *   - `isLogAttached`: 表明 Tauri 后端日志当前是否已成功连接。
 *   - `logError`: 连接失败时的错误对象，成功连接则为 `null`。
 *
 * @example
 * ```vue
 * <template>
 *   <div>
 *     <p v-if="isLogAttached">Tauri 后端日志已连接。</p>
 *     <p v-else-if="logError" style="color: red;">连接失败: {{ logError.message }}</p>
 *     <p v-else>正在尝试连接 Tauri 后端日志...</p>
 *   </div>
 * </template>
 *
 * <script setup lang="ts">
 * import { useTauriConsoleLog } from '@/composables/useTauriConsoleLog'
 *
 * const { isLogAttached, logError } = useTauriConsoleLog()
 * </script>
 * ```
 *
 * @notes
 * 确保 Tauri 项目已安装 `tauri-plugin-log` 插件并正确配置
 *
 * @see {@link https://tauri.app/zh-cn/plugin/logging | Tauri Log Plugin 文档}
 */
export function useTauriPluginLog(): {
  isLogAttached: Ref<boolean>
  logError: Ref<Error | null>
} {
  let detachFunction: (() => void) | null = null

  const isLogAttached = ref(false)
  const logError = ref<Error | null>(null)

  onMounted(async () => {
    try {
      detachFunction = await attachConsole()
      isLogAttached.value = true

      // eslint-disable-next-line no-console
      isDev && console.log('Tauri plugin log initialized')
    }
    catch (error) {
      logError.value = error as Error
      isLogAttached.value = false

      console.error('Tauri plugin log:', error)
    }
  })

  onBeforeUnmount(() => {
    if (detachFunction) {
      detachFunction()

      // eslint-disable-next-line no-console
      isDev && console.log('Tauri plugin log detached')
    }
  })

  return {
    isLogAttached,
    logError,
  }
}

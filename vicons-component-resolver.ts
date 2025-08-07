import { readdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { resolveModule } from 'local-pkg'
import type { ComponentResolver } from 'unplugin-vue-components/types'
import type { Plugin as VitePlugin } from 'vite'

/**
 * 从包名定位到包的根目录
 *
 * 工作原理：
 *  1. 使用 `resolveModule(pkg)` 获取包入口文件路径
 *  2. 逐级向上查找，直到找到包含 `package.json` 的目录
 *
 * @param pkg npm 包名
 * @returns 包根目录的绝对路径；如果未找到则返回 null
 */
function getPackageRootDir(pkg: string): string | null {
  const entry = resolveModule(pkg)
  if (!entry) return null
  let dir = dirname(entry)
  while (true) {
    if (existsSync(join(dir, 'package.json'))) return dir
    const parentDir = dirname(dir)
    if (parentDir === dir) break
    dir = parentDir
  }
  return null
}

/**
 * 支持的 @vicons 图标包及其 PascalCase 前缀映射
 *
 * 结构说明：
 *   - 元组格式：[包名, PascalCase前缀]
 *   - 前缀用于在组件名中区分不同包的同名图标
 *
 * 示例：
 *   ['@vicons/antd', 'Antd'] => AntdUser, AntdSetting
 */
const ICON_PACKAGES: Array<[string, string]> = [
  ['@vicons/antd', 'Antd'],
  ['@vicons/carbon', 'Carbon'],
  ['@vicons/fa', 'Fa'],
  ['@vicons/fluent', 'Fluent'],
  ['@vicons/ionicons4', 'Ion4'],
  ['@vicons/ionicons5', 'Ion5'],
  ['@vicons/material', 'Material'],
  ['@vicons/tabler', 'Tabler']
]

/**
 * 图标文件命名规则：
 *   - 必须以大写字母开头
 *   - 仅包含字母和数字
 *   - 扩展名为 .js / .mjs / .ts
 */
const ICON_FILE_REGEX = /^[A-Z][A-Za-z0-9]+\.(js|mjs|ts)$/

/**
 * 默认支持的文件扩展名
 */
const DEFAULT_ICON_EXTS = ['.js', '.mjs'] as const

/**
 * 图标缓存结构
 *
 * pkgMap：
 *   Key: 包名
 *   Value: PascalCase 格式的图标数组
 *
 * nameToPkgMap：
 *   Key: PascalCase 图标名（带前缀）
 *   Value: 所属包名
 */
interface IconCache {
  pkgMap: Map<string, string[]>
  nameToPkgMap: Map<string, string>
}

let iconCache: IconCache | null = null

/**
 * 调试模式配置
 *
 * list:
 *   - 是否打印每个包部分图标
 *
 * limit:
 *   - list 模式下每包显示的图标数量（默认 3）
 *
 * find:
 *   - 查找指定 PascalCase 图标名
 */
interface IconDebugOptions {
  list?: boolean
  limit?: number
  find?: string | string[]
}

/**
 * 解析器配置选项
 *
 * extensions:
 *   - 自定义文件扩展名列表
 *
 * debug:
 *   - 调试模式配置
 */
interface IconResolverOptions {
  extensions?: string[]
  debug?: IconDebugOptions
}

/**
 * 读取 ES 目录下的文件列表
 *
 * 规则：
 *   - 目录必须存在，否则返回 []
 *   - 仅读取文件（忽略目录）
 *   - 文件名需匹配 ICON_FILE_REGEX
 *   - 扩展名必须在允许列表中
 *
 * @param dir ES 目录路径
 * @param exts 允许的扩展名
 * @returns 图标基础文件名数组（无扩展名）
 */
function readFlatESDir(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) {
    console.warn(`[vicons-component-resolver] ES目录不存在: ${dir}`)
    return []
  }
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(f => f.isFile() && exts.some(ext => f.name.endsWith(ext)) && ICON_FILE_REGEX.test(f.name))
      .map(f => f.name.replace(/\.[^.]+$/, ''))
  } catch (err) {
    console.error(`[vicons-component-resolver] 读取ES目录失败: ${dir}`, err)
    return []
  }
}

/**
 * 调试模式输出
 *
 * 功能：
 *   1. list 模式：每个包打印部分图标
 *   2. find 模式：查找指定图标
 *
 * @param debug 调试配置
 * @param pkgMap 包到图标列表的映射
 * @param nameToPkgMap 图标到包的映射
 */
function runDebugMode(
  debug: IconDebugOptions,
  pkgMap: Map<string, string[]>,
  nameToPkgMap: Map<string, string>
) {
  console.log('=== [vicons-component-resolver 调试模式] ===')

  if (debug.list) {
    const limit = debug.limit ?? 3
    pkgMap.forEach((icons, pkg) => {
      const preview = icons.slice(0, limit).join(', ')
      console.log(`${pkg}: ${preview}${icons.length > limit ? ` ...(共 ${icons.length} 个)` : ''}`)
    })
  }

  if (debug.find) {
    const queries = Array.isArray(debug.find) ? debug.find : [debug.find]
    queries.forEach(q => {
      if (nameToPkgMap.has(q)) {
        console.log(`✅ 找到图标 ${q} (来自 ${nameToPkgMap.get(q)})`)
      } else {
        console.warn(`❌ 未找到图标 ${q}`)
      }
    })
  }

  console.log('===============================')
}

/**
 * 构建图标缓存
 *
 * 处理流程：
 *   1. 遍历 ICON_PACKAGES
 *   2. 获取每个包的 es 目录
 *   3. 读取符合规则的文件名
 *   4. 生成 PascalCase 格式的完整图标名（前缀+原始文件名）
 *   5. 存入 pkgMap 和 nameToPkgMap
 *
 * @param options 解析器配置选项
 * @returns IconCache 缓存对象
 */
function buildIconCache(options: IconResolverOptions = {}): IconCache {
  const exts = [...(options.extensions || DEFAULT_ICON_EXTS)]
  const pkgMap = new Map<string, string[]>()
  const nameToPkgMap = new Map<string, string>()

  for (const [pkg, prefix] of ICON_PACKAGES) {
    const pkgRootDir = getPackageRootDir(pkg)
    if (!pkgRootDir) {
      console.warn(`[vicons-component-resolver] 无法定位图标包: ${pkg}`)
      continue
    }
    const esDirPath = join(pkgRootDir, 'es')
    const iconNames = readFlatESDir(esDirPath, exts)
    if (!iconNames.length) {
      console.warn(`[vicons-component-resolver] ES目录中无图标: ${pkg}`)
      continue
    }

    const pascalIcons = iconNames.map(name => `${prefix}${name}`)
    pkgMap.set(pkg, pascalIcons)
    pascalIcons.forEach(icon => nameToPkgMap.set(icon, pkg))
  }

  if (options.debug && process.env.NODE_ENV === 'development') {
    runDebugMode(options.debug, pkgMap, nameToPkgMap)
  }

  return { pkgMap, nameToPkgMap }
}

/**
 * 确保缓存已构建
 */
function ensureIconCache(options?: IconResolverOptions) {
  if (!iconCache) iconCache = buildIconCache(options)
}

/**
 * 清空缓存
 */
export function resetIconCache() {
  iconCache = null
  if (process.env.NODE_ENV === 'development') {
    console.log('[vicons-component-resolver] 图标缓存已清空')
  }
}

/**
 * 创建组件解析器
 *
 * 用途：
 *   - 自动解析 PascalCase 格式的图标名
 *   - 从对应的 @vicons 包中按需导入
 *
 * @param options 解析器配置选项
 * @returns ComponentResolver 实例
 *
 * 示例：
 *   ```vue
 *   <template>
 *     <AntdUser />
 *   </template>
 *   ```
 */
export function createIconComponentResolver(options?: IconResolverOptions): ComponentResolver {
  ensureIconCache(options)
  return {
    type: 'component',
    resolve: name => {
      const pkg = iconCache?.nameToPkgMap.get(name)
      if (!pkg) return undefined
      const originalName = name.replace(/^[A-Z][a-z0-9]+/, '')
      return { name: originalName, from: pkg }
    }
  }
}

/**
 * 默认导出解析器
 */
export const IconComponentResolver = createIconComponentResolver()

/**
 * 获取所有 PascalCase 图标名
 */
export const getAllPrefixedIcons = (): string[] =>
  (ensureIconCache(), Array.from(iconCache!.nameToPkgMap.keys()))

/**
 * 获取按包分组的图标列表
 */
export const getIconsByPackage = (): Record<string, string[]> =>
  (ensureIconCache(), Object.fromEntries(iconCache!.pkgMap))

/**
 * 获取指定包的图标列表
 */
export const getIconsForPackage = (pkg: string): string[] | null =>
  (ensureIconCache(), iconCache!.pkgMap.get(pkg) || null)

/**
 * 按前缀获取图标
 */
export const getIconsByPrefix = (prefix: string): string[] =>
  (ensureIconCache(), Array.from(iconCache!.nameToPkgMap.keys()).filter(k => k.startsWith(prefix)))

/**
 * Vite HMR 插件
 *
 * 功能：
 *   - 监听图标包的 es 目录
 *   - 当文件变动时清空缓存
 */
export function ViteIconCacheHMR(): VitePlugin {
  return {
    name: 'vite-plugin-icon-cache-hmr',
    apply: 'serve',
    configureServer(server) {
      const watchDirs: string[] = []
      for (const [pkg] of ICON_PACKAGES) {
        const pkgRootDir = getPackageRootDir(pkg)
        if (pkgRootDir) {
          const esDir = join(pkgRootDir, 'es')
          if (existsSync(esDir)) watchDirs.push(esDir)
        }
      }
      server.watcher.add(watchDirs)
      server.watcher.on('change', file => {
        if (ICON_FILE_REGEX.test(file)) resetIconCache()
      })
    }
  }
}

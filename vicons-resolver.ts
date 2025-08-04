import { readdirSync } from 'fs'
import { dirname } from 'path'
import { resolveModule } from 'local-pkg'
import type { ComponentResolver } from 'unplugin-vue-components'

/**
 * key: 图标组件名称
 * value: 模块
 */
let iconPkgMap: Map<string, string> | null = null

const iconPkgs: Array<string> = [
  '@vicons/antd',
  '@vicons/carbon',
  '@vicons/fa',
  '@vicons/fluent',
  '@vicons/ionicons4',
  '@vicons/ionicons5',
  '@vicons/material',
  '@vicons/tabler',
]

export function ViconsResolver(): ComponentResolver {
  function ensureIconPkgMap() {
    if (iconPkgMap !== null) return;
    try {
      const map = new Map<string, string>();
      iconPkgs.forEach(pkg => {
        // The regex /^[A-Z][A-Za-z0-9]+\.js$/ matches icon component files that start with an uppercase letter and are followed by alphanumeric characters, ending with '.js'.
        // Adjust this pattern if your icon files use a different naming convention.
        const icons = readdirSync(dirname(resolveModule(pkg as string) as string), { withFileTypes: true })
          .filter((item) => !item.isDirectory() && item.name.match(/^[A-Z][A-Za-z0-9]+\.js$/))
          .map((item) => item.name.replace(/\.js$/, ''))
        icons.forEach(icon => map.set(icon, pkg))
      })
      iconPkgMap = map;
    } catch (error) {
      throw new Error(`[unplugin-vue-components] failed to load vicons: ${(error as Error).message}`)
    }
  }

  return {
    type: 'component',
    resolve: (name: string) => {
      ensureIconPkgMap();
      if (iconPkgMap.has(name)) {
        return {
          name: name,
          from: iconPkgMap.get(name) as string
        }
      }
    },
  }
}

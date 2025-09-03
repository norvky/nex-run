import presetAttributify from '@unocss/preset-attributify'
import presetWind4 from '@unocss/preset-wind4'
import {
  defineConfig,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
  },
})

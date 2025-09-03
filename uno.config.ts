import presetAttributify from '@unocss/preset-attributify'
import presetWind4 from '@unocss/preset-wind4'
import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        // 'vertical-align': 'middle',
      },
      warn: true,
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
  },
})

import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'wh-full': 'w-full h-full',
  },
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
})

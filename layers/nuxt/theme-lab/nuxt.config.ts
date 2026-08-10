import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-theme-lab'
  },
  extends: [join(currentDir, '../theme')],
  css: [join(currentDir, './app/assets/theme-lab.css')],
  // The local report viewer is a generated SPA with no Nuxt icon endpoint at
  // runtime. Explicitly bundle the layer's icons because the scanner does not
  // reliably traverse components inherited from a packaged Layer.
  icon: {
    clientBundle: {
      icons: [
        'lucide:moon',
        'lucide:sliders-horizontal',
        'lucide:sun',
        'lucide:swatch-book'
      ]
    }
  }
})

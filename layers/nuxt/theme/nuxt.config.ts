import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-theme'
  },
  modules: ['@nuxt/ui'],
  css: [
    '@fontsource-variable/archivo',
    '@fontsource-variable/inter',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    join(currentDir, './app/assets/theme.css')
  ],
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'info',
        'success',
        'warning',
        'error'
      ],
      defaultVariants: {
        size: 'sm',
        color: 'primary'
      }
    }
  }
})

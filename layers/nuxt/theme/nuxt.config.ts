import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

// Dark mode is off until it reads as well as light. Its styles stay in place;
// set this to true to restore the toggles and the visitor's own preference.
// https://github.com/businesslens/pdd/issues/70
const darkMode = false

export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-theme'
  },
  // Forcing light in the document itself keeps a stored dark preference from
  // painting before the app starts, including in the client-only local viewer.
  // A global route middleware then holds every route to light.
  app: darkMode ? {} : { head: { htmlAttrs: { 'data-color-mode-forced': 'light' } } },
  appConfig: { businessLens: { darkMode } },
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

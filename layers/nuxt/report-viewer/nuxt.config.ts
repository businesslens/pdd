import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-report-viewer'
  },
  modules: ['@nuxt/ui'],
  css: [join(currentDir, './app/assets/report-structure.css')]
})

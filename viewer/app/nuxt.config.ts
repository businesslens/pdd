import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const { version: pddVersion } = createRequire(import.meta.url)('../../package.json')

export default defineNuxtConfig({
  extends: [
    resolve('../../layers/nuxt/report-viewer'),
    resolve('../../layers/nuxt/theme-lab')
  ],
  ssr: false,
  devtools: { enabled: false },
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },
  icon: {
    clientBundle: {
      icons: ['lucide:refresh-cw', 'simple-icons:github']
    }
  },
  compatibilityDate: '2024-11-01',
  css: ['~/assets/local-viewer.css'],
  alias: {
    'businesslens/report/view-model': resolve('../../src/report-view-model.ts'),
    'businesslens/report': resolve('../../src/report.ts')
  },
  runtimeConfig: {
    public: {
      pddVersion
    }
  }
})

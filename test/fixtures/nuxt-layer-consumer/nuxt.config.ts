import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    'businesslens/nuxt/report-viewer',
    'businesslens/nuxt/theme-lab'
  ],
  ssr: false,
  compatibilityDate: '2024-11-01'
})

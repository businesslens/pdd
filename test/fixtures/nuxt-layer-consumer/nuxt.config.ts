import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    'businesslens/nuxt/report-viewer'
  ],
  ssr: false,
  compatibilityDate: '2024-11-01'
})

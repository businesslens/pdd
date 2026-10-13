import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    'pdd-toolkit/nuxt/report-viewer'
  ],
  ssr: true,
  compatibilityDate: '2024-11-01'
})

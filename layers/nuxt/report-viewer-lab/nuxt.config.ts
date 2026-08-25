import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Private extension point for Product Report experiments.
 *
 * The local viewer composes this layer; published consumers extend
 * `report-viewer` directly and cannot receive an unfinished experiment.
 */
export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-report-viewer-lab'
  },
  extends: [join(currentDir, '../report-viewer')]
})

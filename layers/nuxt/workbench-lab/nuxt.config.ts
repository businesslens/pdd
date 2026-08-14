import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * The Workbench audition layer.
 *
 * Extended only by the local viewer, never by the shipped package: the same
 * rule the theme lab follows, for the same reason. A reader auditioning four
 * alternative readings of a Product Model should not be able to ship one by
 * accident, and a consumer extending `report-viewer` should not inherit them.
 */
export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-workbench-lab'
  },
  extends: [join(currentDir, '../report-viewer')],
  // The local viewer is a generated SPA with no icon endpoint at runtime, and
  // the scanner does not reliably traverse components inherited from a layer.
  icon: {
    clientBundle: {
      icons: [
        'lucide:columns-3',
        'lucide:git-commit-horizontal',
        'lucide:map',
        'lucide:panels-top-left',
        'lucide:table-2',
        'lucide:corner-down-right',
        'lucide:crosshair',
        'lucide:layers',
        'lucide:list-tree',
        'lucide:maximize-2',
        'lucide:target',
        'lucide:check',
        'lucide:chevron-down',
        'lucide:terminal',
        'lucide:route',
        'lucide:x'
      ]
    }
  }
})

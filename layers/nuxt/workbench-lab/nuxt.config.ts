import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * The Workbench audition layer.
 *
 * Extended only by the local viewer, never by the shipped package: the same
 * rule the theme lab follows, for the same reason. An audition should not be
 * shippable by accident, and a consumer extending `report-viewer` should get
 * the Workbench as it ships and nothing else.
 *
 * The variations work by *shadowing* shipped components — Nuxt resolves a
 * component name from the topmost layer that defines it, so `BlrEntityPeek`
 * and `BlrEntityPage` here stand in front of the ones in `report-viewer`
 * without a single line changing there.
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
        'lucide:flask-conical',
        'lucide:panel-right',
        'lucide:layout',
        'lucide:list-tree',
        'lucide:chevron-down',
        'lucide:chevron-left',
        'lucide:chevron-right',
        'lucide:chevron-up',
        'lucide:check',
        'lucide:x'
      ]
    }
  }
})

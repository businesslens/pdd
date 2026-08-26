import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  $meta: {
    name: 'businesslens-nuxt-report-viewer'
  },
  extends: [join(currentDir, '../theme')],
  css: [
    join(currentDir, './app/assets/report-structure.css'),
    join(currentDir, './app/assets/report-viewer.css')
  ],
  // The bundled local viewer is a generated SPA with no icon endpoint at
  // runtime. Explicitly include icons referenced by inherited components.
  icon: {
    clientBundle: {
      icons: [
        'lucide:align-justify',
        'lucide:app-window',
        'lucide:audio-lines',
        'lucide:arrow-down',
        'lucide:arrow-left',
        'lucide:arrow-right',
        'lucide:arrow-up',
        'lucide:arrow-up-down',
        'lucide:book-open',
        'lucide:bot',
        'lucide:box',
        'lucide:boxes',
        'lucide:braces',
        'lucide:chevron-left',
        'lucide:chevron-down',
        'lucide:chevron-right',
        'lucide:chevron-up',
        'lucide:circle-dot-dashed',
        'lucide:clipboard-list',
        'lucide:corner-down-right',
        'lucide:cpu',
        'lucide:file-code',
        'lucide:file-diff',
        'lucide:file-text',
        'lucide:filter-x',
        'lucide:focus',
        'lucide:gavel',
        'lucide:git-branch',
        'lucide:globe',
        'lucide:image',
        'lucide:layout-grid',
        'lucide:layout-list',
        'lucide:layout-panel-left',
        'lucide:layout-template',
        'lucide:link',
        'lucide:list-checks',
        'lucide:list-filter',
        'lucide:list-ordered',
        'lucide:minus',
        'lucide:microscope',
        'lucide:messages-square',
        'lucide:menu',
        'lucide:monitor',
        'lucide:mouse-pointer-click',
        'lucide:package',
        'lucide:panel-right-open',
        'lucide:plug',
        'lucide:plus',
        'lucide:route',
        'lucide:rows-3',
        'lucide:scale',
        'lucide:scan',
        'lucide:search',
        'lucide:smartphone',
        'lucide:table',
        'lucide:terminal',
        'lucide:user-round',
        'lucide:users',
        'lucide:waypoints',
        'lucide:webhook',
        'lucide:x',
        'lucide:zap'
      ]
    }
  }
})

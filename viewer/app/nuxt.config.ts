import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { defineEventHandler, setHeader } from 'h3'

const { version: pddVersion } = createRequire(import.meta.url)('../../package.json')

// `businesslens view` serves these paths from the CLI. `nuxt dev` has no CLI in
// front of it, so dev-only handlers stand in with a catalog Blueprint — a model
// rich enough to exercise every entity kind the Product Report has to render. They are
// dev handlers, so nothing here reaches the generated viewer.
const fixtureRoot = resolve('../../blueprints/content-feed-reader/.businesslens')

const devHandlers = [
  {
    route: '/_businesslens/report.json',
    handler: defineEventHandler((event) => {
      setHeader(event, 'cache-control', 'no-store')
      return JSON.parse(readFileSync(resolve(fixtureRoot, 'build/report.json'), 'utf8'))
    })
  },
  {
    route: '/_businesslens/logo.svg',
    handler: defineEventHandler((event) => {
      setHeader(event, 'content-type', 'image/svg+xml')
      setHeader(event, 'cache-control', 'no-store')
      /* Schema 5: the Product expands to `product/` once it owns a logo. */
      return readFileSync(resolve(fixtureRoot, 'product/logo.svg'), 'utf8')
    })
  },
  {
    // The viewer opens a stream immediately; without this the dev console fills
    // with reconnect noise that hides real errors.
    route: '/_businesslens/events',
    handler: defineEventHandler((event) => {
      setHeader(event, 'content-type', 'text/event-stream')
      setHeader(event, 'cache-control', 'no-store')
      return ': businesslens dev viewer\n\n'
    })
  }
]

export default defineNuxtConfig({
  extends: [
    // The report layer supplies the stable Product Report and approved identity;
    // the shared lab keeps this host on the same background audition flow as
    // the landing application. Keep the composition here so report-viewer
    // stays neutral for consumers that want only the approved theme.
    // `report-viewer-lab` extends `report-viewer` and remains the private hook
    // for future report auditions. It currently adds no experiment behavior.
    resolve('../../layers/nuxt/report-viewer-lab'),
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
    'businesslens/report': resolve('../../src/report.ts')
  },
  nitro: { devHandlers },
  runtimeConfig: {
    public: {
      pddVersion
    }
  }
})

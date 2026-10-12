import { defineConfig, devices } from '@playwright/test'
import { applyTestServerEnvironment } from './tests/support/environment'

const environment = applyTestServerEnvironment()

// The suites run against what ships: the generated site, served as static files
// the way a static host serves them (`/faq` from `faq.html`). CI generates once
// before the run; locally the server step generates first.
const serve = `serve --no-clipboard --listen ${environment.port} .output/public`
const serverCommand = process.env.CI ? serve : `pnpm generate && ${serve}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results/playwright',
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: environment.appURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  webServer: [{
    command: serverCommand,
    env: environment.env,
    reuseExistingServer: false,
    stderr: 'pipe',
    stdout: 'ignore',
    timeout: 600_000,
    url: environment.appURL
  }],
  workers: 1,
  projects: [{
    name: 'desktop-chromium',
    testMatch: ['**/faq.spec.ts', '**/landing.spec.ts', '**/landing.desktop.spec.ts', '**/header.spec.ts', '**/blueprints.spec.ts', '**/catalog-index.spec.ts', '**/blueprint-feed.spec.ts', '**/blog-feed.spec.ts', '**/docs.spec.ts', '**/docs-vocabulary.spec.ts', '**/seo.spec.ts', '**/changelog.spec.ts', '**/report-parity.spec.ts', '**/production-theme.spec.ts'],
    use: { ...devices['Desktop Chrome'] }
  }, {
    name: 'mobile-chromium',
    testMatch: ['**/faq.spec.ts', '**/landing.spec.ts', '**/landing.mobile.spec.ts', '**/blueprints.spec.ts', '**/catalog-index.spec.ts', '**/docs-vocabulary.spec.ts', '**/header.spec.ts'],
    use: {
      ...devices['Pixel 7'],
      contextOptions: { reducedMotion: 'reduce' }
    }
  }, {
    name: 'webkit',
    testMatch: '**/landing.spec.ts',
    use: { ...devices['Desktop Safari'] }
  }]
})

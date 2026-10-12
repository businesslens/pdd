// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: [
      '.data/**',
      '.nuxt-typecheck/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**'
    ],
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      '@stylistic/max-statements-per-line': 'off',
      // Rechecked on 2026-08-08. Enabling the
      // rule still crashes @nuxt/eslint-plugin 1.16 on this valid `watch` key.
      'nuxt/nuxt-config-keys-order': 'off'
    }
  },
  {
    name: 'pdd-kit/app-boundary',
    files: ['app/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['#server/**', '~/server/**', '~~/server/**', '../**/server/**'],
          message: 'App code must consume client-safe contracts from shared/, never server implementations.'
        }, {
          group: ['h3', 'h3/**', 'nitropack', 'nitropack/**'],
          message: 'Request-runtime packages are server-only.'
        }]
      }]
    }
  },
  {
    name: 'pdd-kit/server-boundary',
    files: ['server/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', {
        name: '$fetch',
        message: 'Portable server code must use the Web Fetch API or an injected fetch implementation.'
      }],
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['#app/**', '~/app/**', '~~/app/**', '../**/app/**'],
          message: 'Server code must not depend on the Nuxt application layer.'
        }, {
          group: ['h3', 'h3/**', 'nitropack', 'nitropack/**'],
          message: 'Server implementations must stay Fetch-compatible; Nuxt owns only thin route adapters.'
        }]
      }]
    }
  },
  {
    name: 'pdd-kit/shared-contract-boundary',
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '#app/**', '#server/**', '~/app/**', '~/server/**', '~~/app/**',
            '~~/server/**', '../**/app/**', '../**/server/**', 'h3',
            'nitropack', 'nitropack/**'
          ],
          message: 'Shared contracts must remain safe for both browser and server bundles.'
        }]
      }]
    }
  }
)

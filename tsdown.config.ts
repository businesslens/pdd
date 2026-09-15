import { defineConfig } from 'tsdown'

export default defineConfig({
  // `report` is the published library entry consumed by BusinessLens Platform;
  // it carries type declarations because it is a cross-repository contract.
  entry: {
    cli: 'src/cli.ts',
    report: 'src/report.ts',
    'report-digest': 'src/report-digest.ts',
    logo: 'src/logo.ts',
    businesslensThemeLabVariants: 'layers/nuxt/theme-lab/app/utils/businesslensThemeLabVariants.ts'
  },
  format: 'esm',
  platform: 'node',
  // Keep the CLI and library bundles within the release tarball's size budget.
  minify: true,
  dts: true,
  clean: true
})

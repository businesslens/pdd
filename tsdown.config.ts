import { defineConfig } from 'tsdown'

export default defineConfig({
  // `report` is the published library entry consumed by BusinessLens Platform;
  // it carries type declarations because it is a cross-repository contract.
  entry: {
    cli: 'src/cli.ts',
    report: 'src/report.ts',
    'report-digest': 'src/report-digest.ts',
    'report-view-model': 'src/report-view-model.ts',
    logo: 'src/logo.ts',
    businesslensThemeLabVariants: 'layers/nuxt/theme-lab/app/utils/businesslensThemeLabVariants.ts'
  },
  format: 'esm',
  platform: 'node',
  dts: true,
  clean: true
})

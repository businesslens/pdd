import { defineConfig } from 'tsdown'

export default defineConfig({
  // `report` is the published library entry consumed by pdd-kit Platform;
  // it carries type declarations because it is a cross-repository contract.
  entry: {
    cli: 'src/cli.ts',
    // Run detached by the CLI to look for a newer release.
    'update-check': 'src/update-check.ts',
    report: 'src/report.ts',
    'report-digest': 'src/report-digest.ts',
    'report-selectors': 'src/report-selectors.ts',
    logo: 'src/logo.ts',
    pddKitThemeLabVariants: 'layers/nuxt/theme-lab/app/utils/pddKitThemeLabVariants.ts'
  },
  format: 'esm',
  platform: 'node',
  // Keep the CLI and library bundles within the release tarball's size budget.
  minify: true,
  dts: true,
  clean: true
})

import { defineConfig } from 'tsdown'

export default defineConfig({
  // `report` is the published library entry consumed by BusinessLens Platform;
  // it carries type declarations because it is a cross-repository contract.
  entry: ['src/cli.ts', 'src/report.ts', 'src/report-digest.ts', 'src/report-view-model.ts', 'src/logo.ts'],
  format: 'esm',
  platform: 'node',
  dts: true,
  clean: true
})

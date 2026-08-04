import { execSync } from 'node:child_process'
import { join } from 'node:path'

/**
 * Build the CLI once, before any test file runs.
 *
 * Suites that spawn `dist/cli.js` used to build it themselves, which meant one
 * file could clear `dist/` while another was mid-spawn. Doing it here makes the
 * artifact exist for the whole run, and keeps `npx vitest run` working on its
 * own without a separate build step.
 */
export default function setup(): void {
  execSync('npm run build', { cwd: join(__dirname, '..'), stdio: 'pipe' })
}

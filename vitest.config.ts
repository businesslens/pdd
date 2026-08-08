import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Several suites spawn the built CLI. Building inside a `beforeAll` meant
    // one file could clear `dist/` while another was spawning from it — a race
    // that surfaced as `dev-link` getting exit 1 from a CLI that existed a
    // moment earlier. Build once, before any file runs.
    globalSetup: ['./test/global-setup.ts'],
    // Claude worktrees are separate repositories and may intentionally carry
    // uncommitted experiments. Do not discover their tests from the parent.
    exclude: [...configDefaults.exclude, '.claude/worktrees/**']
  }
})

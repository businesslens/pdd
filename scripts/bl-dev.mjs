#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const launcher = realpathSync(fileURLToPath(import.meta.url))
const root = realpathSync(join(dirname(launcher), '..'))
const cli = join(root, 'dist', 'cli.js')
const args = process.argv.slice(2)

if (args.length === 1 && args[0] === '--dev-root') {
  console.log(root)
  process.exit(0)
}
if (args.length === 1 && args[0] === '--dev-cli') {
  if (!existsSync(cli)) {
    console.error(`The active BusinessLens CLI is not built at ${cli}. Run \`npm run dev\` in ${root}.`)
    process.exit(1)
  }
  console.log(cli)
  process.exit(0)
}
if (args.length === 1 && args[0] === '--dev-info') {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const branch = spawnSync('git', ['-C', root, 'branch', '--show-current'], { encoding: 'utf8' })
  console.log(`root: ${root}`)
  console.log(`branch: ${branch.status === 0 ? branch.stdout.trim() || '(detached)' : '(unknown)'}`)
  console.log(`version: ${manifest.version}`)
  console.log(`cli: ${existsSync(cli) ? cli : '(not built)'}`)
  process.exit(existsSync(cli) ? 0 : 1)
}

if (!existsSync(cli)) {
  console.error(`The active BusinessLens CLI is not built at ${cli}. Run \`npm run dev\` in ${root}.`)
  process.exit(1)
}

const result = spawnSync(process.execPath, [cli, ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit'
})
if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}
process.exit(result.status ?? 1)

#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve('viewer/app/.output/public')
const target = resolve('dist/viewer')

if (!existsSync(resolve(source, 'index.html'))) {
  console.error('The generated local viewer is missing. Run its Nuxt build first.')
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
mkdirSync(resolve(target, '..'), { recursive: true })
// The package already ships these exact assets in its shared theme layer.
// The local server serves /brand/ from that copy; Nuxt's own output stays intact.
cpSync(source, target, { recursive: true, filter: path => path !== resolve(source, 'brand') })

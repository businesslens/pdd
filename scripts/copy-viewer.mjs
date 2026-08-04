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
cpSync(source, target, { recursive: true })

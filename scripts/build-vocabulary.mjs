#!/usr/bin/env node
/**
 * Generate the report vocabulary registry from its owning documentation pages.
 *
 * The registry is committed, like a lockfile: `npm run check` regenerates it
 * in memory and fails when it differs from the tree, so a definition edited in
 * a page cannot reach the docs site while the report still shows the old line.
 */
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  VOCABULARY_MODULE,
  readVocabulary,
  renderModule
} from './vocabulary.mjs'

const root = process.cwd()
const { terms, errors } = await readVocabulary(root)

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}

await writeFile(resolve(root, VOCABULARY_MODULE), renderModule(terms), 'utf8')

console.log(`Vocabulary: ${terms.length} terms → ${VOCABULARY_MODULE}`)

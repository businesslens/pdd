#!/usr/bin/env node
/**
 * Project the vocabulary each docs page owns onto the surfaces that read it.
 *
 * Both outputs are committed, like a lockfile: `npm run check` regenerates them
 * in memory and fails when they differ from the tree, so a definition edited in
 * a page cannot reach the docs site while the report still shows the old line.
 */
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  VOCABULARY_DOC,
  VOCABULARY_MODULE,
  readVocabulary,
  renderDoc,
  renderModule
} from './vocabulary.mjs'

const root = process.cwd()
const { terms, errors } = await readVocabulary(root)

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}

await writeFile(resolve(root, VOCABULARY_DOC), `${renderDoc(terms)}`, 'utf8')
await writeFile(resolve(root, VOCABULARY_MODULE), renderModule(terms), 'utf8')

console.log(`Vocabulary: ${terms.length} terms → ${VOCABULARY_DOC}, ${VOCABULARY_MODULE}`)

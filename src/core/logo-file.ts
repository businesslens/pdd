import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MAX_PRODUCT_COVER_BYTES,
  MAX_PRODUCT_LOGO_BYTES,
  PRODUCT_COVER_FILENAME,
  PRODUCT_LOGO_FILENAME,
  validateProductCover,
  validateProductLogo
} from '../logo.js'

export interface ProductLogoFile {
  bytes: Buffer
  file: string
}

/** Read an optional Product logo without following links or accepting special files. */
export function readProductLogo(modelRoot: string): ProductLogoFile | undefined {
  const file = join(modelRoot, '.businesslens', 'product', PRODUCT_LOGO_FILENAME)
  if (!existsSync(file)) return undefined

  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error('logo.svg must be a regular file, not a symbolic link')
  }
  if (stat.size > MAX_PRODUCT_LOGO_BYTES) {
    throw new Error(`logo.svg must be at most ${MAX_PRODUCT_LOGO_BYTES / 1024} KiB`)
  }

  const bytes = readFileSync(file)
  const issues = validateProductLogo(bytes)
  if (issues.length) throw new Error(issues.join('; '))
  return { bytes, file }
}

export interface ProductCoverFile {
  bytes: Buffer
  file: string
}

/** Read an optional Product cover the same way: no links, no special files. */
export function readProductCover(modelRoot: string): ProductCoverFile | undefined {
  const file = join(modelRoot, '.businesslens', 'product', PRODUCT_COVER_FILENAME)
  if (!existsSync(file)) return undefined

  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error('cover.webp must be a regular file, not a symbolic link')
  }
  if (stat.size > MAX_PRODUCT_COVER_BYTES) {
    throw new Error(`cover.webp must be at most ${MAX_PRODUCT_COVER_BYTES / 1024 / 1024} MiB`)
  }

  const bytes = readFileSync(file)
  const issues = validateProductCover(bytes)
  if (issues.length) throw new Error(issues.join('; '))
  return { bytes, file }
}

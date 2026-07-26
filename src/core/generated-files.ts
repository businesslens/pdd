import {
  closeSync,
  constants,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  writeFileSync
} from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

function assertDirectory(path: string): void {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing to use a symbolic link for generated BusinessLens output: ${path}`)
  }
  if (!stat.isDirectory()) {
    throw new Error(`Generated BusinessLens output path is not a directory: ${path}`)
  }
}

/**
 * Resolve a generated output file inside the repository without traversing
 * repository-controlled symlinks. Missing parent directories are created one
 * component at a time and checked immediately.
 */
export function generatedFilePath(repositoryRoot: string, ...segments: string[]): string {
  if (
    segments.length < 2
    || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\'))
  ) {
    throw new Error('Generated BusinessLens output requires safe repository-relative path segments.')
  }

  const root = realpathSync(resolve(repositoryRoot))
  const output = resolve(root, ...segments)
  const outputRelative = relative(root, output)
  if (!outputRelative || outputRelative === '..' || outputRelative.startsWith(`..${sep}`) || isAbsolute(outputRelative)) {
    throw new Error('Generated BusinessLens output must stay inside the repository.')
  }

  let current = root
  for (const segment of segments.slice(0, -1)) {
    current = join(current, segment)
    try {
      assertDirectory(current)
    } catch (error) {
      if (!isMissing(error)) throw error
      try {
        mkdirSync(current)
      } catch (mkdirError) {
        if ((mkdirError as NodeJS.ErrnoException).code !== 'EEXIST') throw mkdirError
      }
      assertDirectory(current)
    }
  }

  if (realpathSync(current) !== current) {
    throw new Error(`Generated BusinessLens output resolves outside its expected directory: ${current}`)
  }

  try {
    const stat = lstatSync(output)
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to overwrite a symbolic link with generated BusinessLens output: ${output}`)
    }
    if (!stat.isFile()) {
      throw new Error(`Generated BusinessLens output path is not a regular file: ${output}`)
    }
  } catch (error) {
    if (!isMissing(error)) throw error
  }

  return output
}

export function writeGeneratedFile(repositoryRoot: string, segments: string[], contents: string): string {
  const output = generatedFilePath(repositoryRoot, ...segments)
  const noFollow = constants.O_NOFOLLOW ?? 0
  let descriptor: number
  try {
    descriptor = openSync(
      output,
      constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | noFollow,
      0o600
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ELOOP') {
      throw new Error(`Refusing to overwrite a symbolic link with generated BusinessLens output: ${output}`)
    }
    throw error
  }
  try {
    writeFileSync(descriptor, contents, { encoding: 'utf8' })
  } finally {
    closeSync(descriptor)
  }
  return output
}

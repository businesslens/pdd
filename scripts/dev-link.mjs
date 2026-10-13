import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'

export function developmentBinDirectory(env = process.env) {
  return resolve(env.PDD_KIT_DEV_BIN_DIR || join(homedir(), '.local', 'bin'))
}

function pathState(path) {
  try {
    return lstatSync(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

function symlinkTarget(link) {
  return resolve(dirname(link), readlinkSync(link))
}

function isPddKitLauncher(target) {
  if (basename(target) !== 'pdd-kit-dev.mjs') return false
  try {
    const packageRoot = resolve(dirname(target), '..')
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
    return manifest.name === 'pdd-toolkit'
  } catch {
    return false
  }
}

export function activateDevelopmentLink(root, env = process.env) {
  const launcher = join(resolve(root), 'scripts', 'pdd-kit-dev.mjs')
  const binDirectory = developmentBinDirectory(env)
  const link = join(binDirectory, 'pdd-kit-dev')
  const existing = pathState(link)

  if (existing && !existing.isSymbolicLink()) {
    throw new Error(`Refusing to replace ${link}: it is not a symbolic link.`)
  }
  if (existing) {
    const target = symlinkTarget(link)
    if (!isPddKitLauncher(target)) {
      throw new Error(`Refusing to replace ${link}: it is not a pdd-kit development link.`)
    }
  }

  mkdirSync(binDirectory, { recursive: true })
  const temporary = join(binDirectory, `.pdd-kit-dev.${process.pid}.${Date.now()}.tmp`)
  try {
    symlinkSync(launcher, temporary)
    renameSync(temporary, link)
  } finally {
    rmSync(temporary, { force: true })
  }
  return { link, launcher }
}

export function removeDevelopmentLink(root, env = process.env) {
  const launcher = join(resolve(root), 'scripts', 'pdd-kit-dev.mjs')
  const link = join(developmentBinDirectory(env), 'pdd-kit-dev')
  const existing = pathState(link)
  if (!existing) return { link, removed: false }
  if (!existing.isSymbolicLink()) {
    throw new Error(`Refusing to remove ${link}: it is not a symbolic link.`)
  }

  const target = symlinkTarget(link)
  if (target !== launcher) {
    const display = relative(resolve(root), target) || target
    throw new Error(`Refusing to remove ${link}: it points to another active worktree (${display}).`)
  }
  rmSync(link)
  return { link, removed: true }
}

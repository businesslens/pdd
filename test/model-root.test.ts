import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildProject } from '../src/commands/build.js'
import { resolveModelRoot } from '../src/core/model-root.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const BLUEPRINT = join(__dirname, '..', 'blueprints', 'content-feed-reader', '.businesslens')
const temporary: string[] = []

function scratch(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  temporary.push(dir)
  // git reports the real path, and on macOS the temp dir is behind a symlink.
  return realpathSync(dir)
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

afterEach(() => {
  let dir = temporary.pop()
  while (dir) {
    rmSync(dir, { recursive: true, force: true })
    dir = temporary.pop()
  }
})

describe('resolveModelRoot', () => {
  it('prefers a model in the working directory over one at the repository root', () => {
    const repo = scratch('businesslens-model-root-nested-')
    git(repo, 'init', '--initial-branch=main')
    cpSync(join(FIXTURE, '.businesslens'), join(repo, '.businesslens'), { recursive: true })

    // The catalog keeps one model per blueprints/<slug>/, so the nearest model wins.
    const nested = join(repo, 'blueprints', 'content-feed-reader')
    mkdirSync(nested, { recursive: true })
    cpSync(join(FIXTURE, '.businesslens'), join(nested, '.businesslens'), { recursive: true })

    expect(resolveModelRoot(nested)).toEqual({ modelRoot: nested, gitRoot: repo })
    expect(resolveModelRoot(repo)).toEqual({ modelRoot: repo, gitRoot: repo })
  })

  it('falls back to the repository root when the working directory has no model', () => {
    const repo = scratch('businesslens-model-root-fallback-')
    git(repo, 'init', '--initial-branch=main')
    cpSync(join(FIXTURE, '.businesslens'), join(repo, '.businesslens'), { recursive: true })
    const deep = join(repo, 'src', 'commands')
    mkdirSync(deep, { recursive: true })

    expect(resolveModelRoot(deep)).toEqual({ modelRoot: repo, gitRoot: repo })
  })

  it('resolves a model that sits outside any repository, reporting no git root', () => {
    const loose = scratch('businesslens-model-root-loose-')
    cpSync(join(FIXTURE, '.businesslens'), join(loose, '.businesslens'), { recursive: true })

    const resolved = resolveModelRoot(loose)
    expect(resolved.modelRoot).toBe(loose)
    expect(resolved.gitRoot).toBeUndefined()
  })

  it('builds a Blueprint model outside a repository with an empty tracked set', () => {
    const loose = scratch('businesslens-model-root-build-')
    // A Blueprint carries no codeRefs, so it is the case that can legitimately
    // build with nothing tracked. A model that does claim evidence still fails,
    // because an empty tracked set makes every one of its codeRefs unresolvable.
    cpSync(BLUEPRINT, join(loose, '.businesslens'), { recursive: true })

    const { report } = buildProject(loose)
    expect(report.coverage.sourceAreas).toEqual([])
    expect(Object.values(report.model).flatMap(value =>
      Array.isArray(value) ? value.flatMap(item => item.codeRefs || []) : []
    )).toEqual([])
  })

  it('refuses to build a model claiming evidence when nothing is tracked', () => {
    const loose = scratch('businesslens-model-root-evidence-')
    cpSync(join(FIXTURE, '.businesslens'), join(loose, '.businesslens'), { recursive: true })

    expect(() => buildProject(loose)).toThrow(/is not a tracked file/)
  })

  it('reports a missing model rather than a missing repository', () => {
    const empty = scratch('businesslens-model-root-empty-')
    expect(() => resolveModelRoot(empty)).toThrow(/No \.businesslens\/ product model found/)
  })
})

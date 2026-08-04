import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './git.js'

export interface ModelRoot {
  /** Directory containing `.businesslens/`. */
  modelRoot: string
  /** Enclosing Git repository, when there is one. Absent outside a repository. */
  gitRoot?: string
}

/**
 * Resolve the directory that owns the `.businesslens/` model.
 *
 * The model is not always at the Git root. A repository may carry several — the
 * Blueprint catalog keeps one per `blueprints/<slug>/` — so the command's
 * working directory wins over the repository root, and a model may exist with
 * no repository at all. `--cwd` changes that working directory; explicitly
 * passing `--cwd .` is therefore identical to omitting it.
 *
 * `gitRoot` is reported separately because it means something different: it is
 * where code-reference targets are resolved and tracked files are listed. A
 * model outside a repository has no tracked files, so repository-specific code
 * references are invalid there.
 */
export function resolveModelRoot(cwd: string): ModelRoot {
  let gitRoot: string | undefined
  try {
    gitRoot = repoRoot(cwd)
  } catch {
    gitRoot = undefined
  }

  if (existsSync(join(cwd, '.businesslens'))) {
    return gitRoot ? { modelRoot: cwd, gitRoot } : { modelRoot: cwd }
  }
  if (gitRoot && existsSync(join(gitRoot, '.businesslens'))) {
    return { modelRoot: gitRoot, gitRoot }
  }

  throw new Error(
    'No .businesslens/ Product Model found here or at the repository root — use `businesslens-map` for established code or `businesslens-ideate` for a new product'
  )
}

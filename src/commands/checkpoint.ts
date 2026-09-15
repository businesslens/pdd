import { compileReport } from './export.js'
import { lintModel } from './lint.js'
import { writeCheckpoint, type CheckpointMeta } from '../core/checkpoints.js'
import { lsFiles } from '../core/git.js'
import { loadModel, type PddModel } from '../core/model.js'
import { resolveModelRoot, type ModelRoot } from '../core/model-root.js'
import type { CheckpointSource } from '../core/report-diff.js'

/**
 * Seal the model as it stands into `.businesslens/cache/checkpoints/`.
 *
 * The caller has already linted `model` clean; compiling it cannot fail on
 * structure. A round is whatever the caller says it is — an agent's approved
 * delta, a person's "before I try this" — so nothing here second-guesses it.
 */
export function sealCheckpoint(
  resolved: ModelRoot,
  model: PddModel,
  options: { source: CheckpointSource, label?: string | null }
): CheckpointMeta {
  const today = new Date().toISOString().slice(0, 10)
  const report = compileReport(model, today, resolved.gitRoot ?? resolved.modelRoot)
  return writeCheckpoint(resolved.modelRoot, report, { ...options, referenceRoot: resolved.gitRoot ?? resolved.modelRoot })
}

export function runCheckpoint(cwd: string, label?: string): number {
  try {
    const resolved = resolveModelRoot(cwd)
    const model = loadModel(resolved.modelRoot)
    const result = lintModel(model, resolved.gitRoot ? lsFiles(resolved.gitRoot) : [])
    if (!result.ok) {
      for (const error of result.errors) console.error(`error: ${error}`)
      console.error(`A checkpoint seals a model that lints clean; fix ${result.errors.length} error(s) first.`)
      return 1
    }
    const meta = sealCheckpoint(resolved, model, { source: 'checkpoint', label })
    console.log(meta.label ? `Checkpoint saved: ${meta.label}` : `Checkpoint saved at ${meta.at}.`)
    return 0
  } catch (error) {
    console.error(`error: ${(error as Error).message}`)
    return 1
  }
}

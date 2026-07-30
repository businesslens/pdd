import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stringify } from 'yaml'
import { parseCanonicalName } from '../core/canonical-name.js'
import { lsFiles, provenance } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot } from '../core/model-root.js'
import { redactSourceEvidence } from '../core/portable.js'
import { buildProject } from './export.js'
import { expandProductReport } from './open.js'
import { validateModel } from './validate.js'

/**
 * Where contributions go.
 *
 * Overridable for the same reason the catalog origin is: anyone running their
 * own catalog needs their own Blueprint repository behind it, and the two have
 * to be able to point at the same deployment.
 */
function upstreamRepository(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.BUSINESSLENS_CONTRIBUTE_UPSTREAM?.trim()
  if (!configured) return 'businesslens/pdd'
  if (!/^[\w.-]+\/[\w.-]+$/.test(configured)) {
    throw new Error('BUSINESSLENS_CONTRIBUTE_UPSTREAM must be an "owner/repo" pair.')
  }
  return configured
}

export interface ContributeOptions {
  slug?: string
  yes: boolean
}

class ContributeUsageError extends Error {}

function gh(args: string[], cwd?: string): string {
  const result = spawnSync('gh', args, { encoding: 'utf8', cwd, maxBuffer: 32 * 1024 * 1024 })
  if (result.status !== 0) {
    throw new Error(`gh ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`)
  }
  return result.stdout.trim()
}

function requireGh(): void {
  const version = spawnSync('gh', ['--version'], { encoding: 'utf8' })
  if (version.status !== 0) {
    throw new Error(
      'The GitHub CLI (`gh`) is required to contribute a Blueprint.\n'
      + 'Install it from https://cli.github.com, then run `gh auth login`.'
    )
  }
  const auth = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' })
  if (auth.status !== 0) {
    throw new Error('`gh` is installed but not authenticated. Run `gh auth login` first.')
  }
}

/**
 * Whether the authenticated user can push to the upstream directly.
 *
 * Best-effort: if either call fails we assume they cannot and fork, which is the
 * safe direction — a failed fork is a clear error, whereas a failed push to
 * someone else's repository is a confusing one.
 */
function ownsUpstream(upstream: string): boolean {
  try {
    const viewer = gh(['api', 'user', '--jq', '.login'])
    const owner = gh(['repo', 'view', upstream, '--json', 'owner', '--jq', '.owner.login'])
    return viewer.toLowerCase() === owner.toLowerCase()
  } catch {
    return false
  }
}

/** Best-effort attribution. A Blueprint author may have no repository at all. */
function bestEffortOrigin(cwd: string): { repository: string, commit: string } | undefined {
  try {
    const pinned = provenance(cwd, { requireClean: false })
    return { repository: pinned.repositoryUrl, commit: pinned.commit }
  } catch {
    return undefined
  }
}

export async function runContribute(cwd: string, options: ContributeOptions): Promise<number> {
  let workspace: string | undefined
  try {
    const UPSTREAM = upstreamRepository()
    // Cheapest checks first: a bad slug or a missing `gh` should not cost the
    // user a build.
    if (options.slug !== undefined) parseCanonicalName(options.slug)
    requireGh()

    const { modelRoot, gitRoot } = resolveModelRoot(cwd)
    const model = loadModel(modelRoot)

    // Validate against the repository's tracked files, exactly as `validate`
    // does. Passing an empty set would report every codeRef in a brownfield
    // model as untracked — and a brownfield model is the common case here.
    const validation = validateModel(model, gitRoot ? lsFiles(gitRoot) : [])
    if (!validation.ok) {
      throw new Error(
        `The Product Model has validation errors:\n${validation.errors.map(error => `- ${error}`).join('\n')}`
      )
    }

    const { report } = buildProject(modelRoot)
    const redacted = redactSourceEvidence(report)

    const slug = parseCanonicalName(options.slug ?? redacted.id)

    // Regenerate the model from the redacted report rather than copying the
    // authored files. codeRefs live in authored frontmatter and survive a copy;
    // only expansion strips them. It also makes the pull request byte-identical
    // to what `businesslens pull <slug>` produces. See ADR-0005.
    workspace = mkdtempSync(join(tmpdir(), 'businesslens-contribute-'))
    const regenerated = join(workspace, 'model')
    mkdirSync(regenerated, { recursive: true })
    expandProductReport(regenerated, redacted, false)

    const origin = bestEffortOrigin(modelRoot)
    const manifest = {
      slug,
      title: redacted.title,
      summary: redacted.description.split('\n')[0]!.slice(0, 400),
      category: 'Uncategorized',
      tags: redacted.tags?.length ? redacted.tags : [slug],
      icon: 'i-lucide-box',
      accent: '#b8965c',
      authors: ['Unattributed'],
      license: 'MIT',
      ...(origin ? { origin } : {})
    }

    if (!options.yes) {
      if (!process.stdin.isTTY) {
        throw new ContributeUsageError(
          'Refusing to open a pull request without confirmation in a non-interactive session. Pass --yes.'
        )
      }
      const readline = createInterface({ input: process.stdin, output: process.stdout })
      const answer = await readline.question(
        `Open a public pull request adding Blueprint "${slug}" to ${UPSTREAM}? [y/N] `
      )
      readline.close()
      if (!/^y(es)?$/i.test(answer.trim())) {
        console.log('Aborted.')
        return 1
      }
    }

    const checkout = join(workspace, 'pdd')

    // Fork when the contributor does not own the upstream, clone directly when
    // they do. GitHub refuses to let one account own both a parent and a fork,
    // so a maintainer contributing to their own repository cannot fork it — and
    // does not need to, because they can push a branch to it.
    if (ownsUpstream(UPSTREAM)) {
      console.log(`Cloning ${UPSTREAM}…`)
      gh(['repo', 'clone', UPSTREAM, checkout], workspace)
    } else {
      console.log(`Forking and cloning ${UPSTREAM}…`)
      gh(['repo', 'fork', UPSTREAM, '--clone=true', '--remote=false', '--fork-name=pdd'], workspace)
      if (!existsSync(checkout)) throw new Error('Unexpected clone location.')
    }

    const branch = `blueprint/${slug}`
    execFileSync('git', ['-C', checkout, 'checkout', '-b', branch], { stdio: 'pipe' })

    const target = join(checkout, 'blueprints', slug)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    cpSync(join(regenerated, '.businesslens'), join(target, '.businesslens'), { recursive: true })
    rmSync(join(target, '.businesslens', 'build'), { recursive: true, force: true })
    rmSync(join(target, '.businesslens', 'cache'), { recursive: true, force: true })
    writeFileSync(join(target, 'blueprint.yaml'), stringify(manifest), 'utf8')

    execFileSync('git', ['-C', checkout, 'add', '-A'], { stdio: 'pipe' })
    execFileSync('git', ['-C', checkout, 'commit', '-m', `feat: add the ${slug} Blueprint`], { stdio: 'pipe' })
    execFileSync('git', ['-C', checkout, 'push', '-u', 'origin', branch], { stdio: 'pipe' })

    const url = gh([
      'pr', 'create',
      '--repo', UPSTREAM,
      '--base', 'main',
      '--title', `Add the ${slug} Blueprint`,
      '--body', [
        `Adds \`blueprints/${slug}\`.`,
        '',
        `- **Title:** ${manifest.title}`,
        `- **Summary:** ${manifest.summary}`,
        '',
        'The model in this pull request was regenerated from a redacted Product Report,',
        'so it carries no `codeRefs` and no source paths, and is byte-identical to what',
        '`businesslens pull` produces.',
        '',
        'Please review the category, tags, icon, accent, and authors in `blueprint.yaml` —',
        '`contribute` fills them with placeholders it cannot infer.'
      ].join('\n')
    ], checkout)

    console.log(`\nOpened ${url}`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof ContributeUsageError ? 2 : 1
  } finally {
    if (workspace) rmSync(workspace, { recursive: true, force: true })
  }
}

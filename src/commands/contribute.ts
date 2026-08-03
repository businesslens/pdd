import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stringify } from 'yaml'
import { parseCanonicalName } from '../core/canonical-name.js'
import { lsFiles } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot } from '../core/model-root.js'
import { redactSourceEvidence } from '../core/portable.js'
import { buildProject } from './export.js'
import { expandProductReport } from './open.js'
import { lintModel } from './lint.js'

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

function viewerLogin(): string {
  return gh(['api', 'user', '--jq', '.login'])
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
    const owner = gh(['repo', 'view', upstream, '--json', 'owner', '--jq', '.owner.login'])
    return viewerLogin().toLowerCase() === owner.toLowerCase()
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise(resolve => { setTimeout(resolve, ms) })

/**
 * The open pull request for `head`, if there already is one.
 *
 * Re-contributing the same slug is the normal way to revise a Blueprint, and
 * GitHub rejects a second pull request for a branch that already has one.
 * Pushing has already updated it by this point, so reporting the existing URL
 * is the honest outcome rather than an error.
 */
function prUrlFor(upstream: string, head: string, cwd: string): string | undefined {
  try {
    return gh(
      ['pr', 'list', '--repo', upstream, '--head', head, '--state', 'open', '--json', 'url', '--jq', '.[0].url'],
      cwd
    ) || undefined
  } catch {
    return undefined
  }
}

/**
 * Clone, retrying briefly.
 *
 * A fork GitHub has just created is not always immediately clonable. `gh repo
 * fork --clone` handles that internally, but we fork and clone as separate
 * steps so the checkout lands where we choose rather than in a directory named
 * after whatever the fork turned out to be called.
 */
async function cloneWithRetry(repo: string, destination: string): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      gh(['repo', 'clone', repo, destination])
      return
    } catch (error) {
      if (attempt === 3) throw error
      await sleep(attempt * 1500)
    }
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

    // Lint against the repository's tracked files, exactly as `lint`
    // does. Passing an empty set would report every codeRef in a brownfield
    // model as untracked — and a brownfield model is the common case here.
    const lint = lintModel(model, gitRoot ? lsFiles(gitRoot) : [])
    if (!lint.ok) {
      throw new Error(
        `The Product Model has lint errors:\n${lint.errors.map(error => `- ${error}`).join('\n')}`
      )
    }

    // `buildProject` already emits the source-free profile. This second pass
    // is deliberate rather than leftover: it is the only path that
    // publishes the user's model to a public repository, redaction is
    // idempotent, and the guarantee should not depend on a caller further up
    // continuing to hold.
    const { report } = buildProject(modelRoot)
    const redacted = redactSourceEvidence(report)

    const slug = parseCanonicalName(options.slug ?? redacted.id)

    // Regenerate the model from the redacted report rather than copying the
    // authored files. codeRefs live in authored frontmatter and survive a copy;
    // only expansion strips them. It also makes the pull request byte-identical
    // to what `businesslens blueprint pull <slug>` produces.
    workspace = mkdtempSync(join(tmpdir(), 'businesslens-contribute-'))
    const regenerated = join(workspace, 'model')
    mkdirSync(regenerated, { recursive: true })
    expandProductReport(regenerated, redacted, false)

    // Deliberately carries no origin repository or commit. The point of
    // regenerating from a redacted report is that the contribution discloses
    // nothing about where it came from, and a private repository's URL is
    // exactly the kind of thing that must not land in a public pull request.
    // The catalog does not store it either — its manifest schema has no such
    // field — so publishing it would leak without buying anything. Provenance a
    // maintainer legitimately needs is already on the pull request itself.
    const manifest = {
      slug,
      title: redacted.title,
      summary: redacted.description.split('\n')[0]!.slice(0, 400),
      category: 'Uncategorized',
      tags: redacted.tags?.length ? redacted.tags : [slug],
      icon: 'i-lucide-box',
      accent: '#b8965c',
      authors: ['Unattributed'],
      license: 'MIT'
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

    const checkout = join(workspace, 'checkout')
    const upstreamName = UPSTREAM.split('/')[1]!
    let fork: string | undefined

    // Fork when the contributor does not own the upstream, clone directly when
    // they do. GitHub refuses to let one account own both a parent and a fork,
    // so a maintainer contributing to their own repository cannot fork it — and
    // does not need to, because they can push a branch to it.
    if (ownsUpstream(UPSTREAM)) {
      console.log(`Cloning ${UPSTREAM}…`)
      await cloneWithRetry(UPSTREAM, checkout)
    } else {
      // `--clone=false` on purpose. A returning contributor already has this
      // fork, and letting `gh` clone it would put the checkout in a directory
      // named after the fork — which we do not control and cannot predict once
      // someone has renamed theirs.
      console.log(`Forking ${UPSTREAM}…`)
      gh(['repo', 'fork', UPSTREAM, '--clone=false', '--fork-name', upstreamName], workspace)
      fork = `${viewerLogin()}/${upstreamName}`

      // A fork left from an earlier contribution still has whatever `main` it
      // had then. Branching off stale history puts unrelated commits — or a
      // conflict — into the pull request, so bring it up to date first.
      // `--force` because this fork's default branch is a mirror we never keep
      // work on; every contribution lives on its own `blueprint/` branch.
      try {
        gh(['repo', 'sync', fork, '--source', UPSTREAM, '--branch', 'main', '--force'], workspace)
      } catch (error) {
        throw new Error(
          `Could not bring ${fork} up to date with ${UPSTREAM}:\n${(error as Error).message}\n\n`
          + 'Contributing from a stale fork would open a pull request containing unrelated\n'
          + `changes. Update the GitHub CLI, or delete ${fork} and run this again.`
        )
      }

      console.log(`Cloning ${fork}…`)
      await cloneWithRetry(fork, checkout)
    }

    const branch = `blueprint/${slug}`
    execFileSync('git', ['-C', checkout, 'checkout', '--quiet', '-b', branch], { stdio: 'pipe' })

    const target = join(checkout, 'blueprints', slug)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    cpSync(join(regenerated, '.businesslens'), join(target, '.businesslens'), { recursive: true })
    rmSync(join(target, '.businesslens', 'build'), { recursive: true, force: true })
    rmSync(join(target, '.businesslens', 'cache'), { recursive: true, force: true })
    writeFileSync(join(target, 'blueprint.yaml'), stringify(manifest), 'utf8')

    execFileSync('git', ['-C', checkout, 'add', '-A'], { stdio: 'pipe' })
    execFileSync('git', ['-C', checkout, 'commit', '-m', `feat: add the ${slug} Blueprint`], { stdio: 'pipe' })

    // Force onto our own branch. `blueprint/<slug>` is owned by this command on
    // the contributor's own fork, and since every run rebuilds from upstream
    // main, a retry or a revised submission always diverges from whatever the
    // previous attempt left there. Nothing else is ever pushed to it.
    execFileSync(
      'git',
      ['-C', checkout, 'push', '--quiet', '--force', 'origin', `HEAD:refs/heads/${branch}`],
      { stdio: 'pipe' }
    )

    const head = fork ? `${fork.split('/')[0]}:${branch}` : branch
    const reportFork = () => {
      if (!fork) return
      console.log(
        `\nThis used your fork ${fork}. GitHub needs it to keep the pull request `
        + 'open, so leave it in place until the Blueprint is merged.'
      )
    }

    const existing = prUrlFor(UPSTREAM, head, checkout)
    if (existing) {
      console.log(`\nUpdated ${existing}`)
      reportFork()
      return 0
    }

    const url = gh([
      'pr', 'create',
      '--repo', UPSTREAM,
      '--base', 'main',
      '--head', head,
      '--title', `Add the ${slug} Blueprint`,
      '--body', [
        `Adds \`blueprints/${slug}\`.`,
        '',
        `- **Title:** ${manifest.title}`,
        `- **Summary:** ${manifest.summary}`,
        '',
        'Everything in this pull request was regenerated from a redacted Product Report,',
        'so it carries no `codeRefs`, no source paths, and no reference to the repository',
        'it came from, and is byte-identical to what `businesslens blueprint pull` produces.',
        '',
        'Please review the category, tags, icon, accent, and authors in `blueprint.yaml` —',
        '`contribute` fills them with placeholders it cannot infer.'
      ].join('\n')
    ], checkout)

    console.log(`\nOpened ${url}`)
    reportFork()
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof ContributeUsageError ? 2 : 1
  } finally {
    if (workspace) rmSync(workspace, { recursive: true, force: true })
  }
}

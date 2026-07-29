import {
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  writeFileSync
} from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { stringify } from 'yaml'
import type { ProductReportV4 } from '../core/portable.js'
import { validateModel } from './validate.js'
import { loadModel } from '../core/model.js'
import { parseProductReport } from '../core/portable.js'
import { reportDigest } from '../core/report-digest.js'
import { DEFAULT_PLATFORM_URL } from '../core/platform-url.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024
const OPEN_COVERAGE_METHOD = 'Opened from a Product Report; source repository evidence was intentionally removed.'
const OPEN_COVERAGE_LIMITATION = 'Implementation evidence must be established in this repository.'
const OPEN_COVERAGE_RATIONALE = 'Product behavior and relationships were imported from a Product Report. Source-repository code references were removed because they are not evidence for this repository.'

function isLoopback(hostname: string): boolean {
  const host = hostname.replace(/^\[(.*)\]$/, '$1')
  return host === 'localhost' || host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host)
}

function trustedReportUrl(source: string): URL {
  const url = new URL(source)
  const official = url.origin === DEFAULT_PLATFORM_URL && url.protocol === 'https:'
  const loopback = isLoopback(url.hostname) && (url.protocol === 'http:' || url.protocol === 'https:')
  if (
    (!official && !loopback)
    || url.username
    || url.password
    || url.search
    || url.hash
    || !/^\/api\/v1\/hub\/blueprints\/[^/]+(?:\/releases\/\d+)?\/report\.json$/.test(url.pathname)
  ) {
    throw new Error('Remote reports must use an official BusinessLens Hub report URL or the equivalent loopback development URL.')
  }
  return url
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REPORT_BYTES) {
      await reader.cancel()
      throw new Error('The Hub report exceeds the 8 MiB safety limit.')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

async function readRemoteReport(source: string): Promise<unknown> {
  const url = trustedReportUrl(source)
  const response = await fetch(url, {
    headers: { accept: 'application/vnd.businesslens.report+json; version=4, application/json' },
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000)
  })
  if (response.status >= 300 && response.status < 400) {
    throw new Error('Refusing a redirected Hub report response.')
  }
  if (!response.ok) throw new Error(`Hub report request failed with status ${response.status}.`)
  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_REPORT_BYTES) throw new Error('The Hub report exceeds the 8 MiB safety limit.')
  const text = await readLimitedBody(response)
  const report = JSON.parse(text) as unknown
  const expectedDigest = response.headers.get('x-businesslens-report-digest')
  if (expectedDigest) {
    const actualDigest = reportDigest(report)
    if (!/^[a-f0-9]{64}$/i.test(expectedDigest) || actualDigest !== expectedDigest.toLowerCase()) {
      throw new Error('The Hub report digest does not match its response header.')
    }
  }
  return report
}

async function readReportSource(source: string): Promise<unknown> {
  if (/^https?:\/\//i.test(source)) return readRemoteReport(source)
  const file = isAbsolute(source) ? source : resolve(process.cwd(), source)
  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('The report source must be a regular file, not a symbolic link.')
  if (stat.size > MAX_REPORT_BYTES) throw new Error('The report exceeds the 8 MiB safety limit.')
  return JSON.parse(readFileSync(file, 'utf8'))
}

function frontmatter(data: Record<string, unknown>): string {
  return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n`
}

function links(value: ProductReportV4['links']): Array<Record<string, string>> {
  return value.map(link => ({
    rel: link.rel,
    href: link.href,
    ...(link.title ? { title: link.title } : {})
  }))
}

function entryPoints(value: Array<{ type: string, path: string }>): Array<Record<string, string>> {
  return value.map(point => ({ [point.type]: point.path }))
}

function compactRecord(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => {
    if (value === undefined) return false
    return !Array.isArray(value) || value.length > 0
  }))
}

function body(
  title: string,
  lead: string,
  intent: string,
  sections: Array<{ heading: string, content: string }>,
  supportingContent: string
): string {
  const blocks = [`# ${title}`, lead]
  if (intent) blocks.push(`## Intent\n\n${intent}`)
  for (const item of sections) {
    if (item.content) blocks.push(`## ${item.heading}\n\n${item.content}`)
  }
  if (supportingContent) blocks.push(supportingContent)
  return `${blocks.filter(Boolean).join('\n\n')}\n`
}

function write(path: string, content: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true })
  // Default umask permissions: the expanded model is committed and read by the
  // whole team, so it must not land as owner-only.
  writeFileSync(path, content, { encoding: 'utf8', flag: 'wx' })
}

function prepareTarget(cwd: string, force: boolean): string {
  const root = resolve(cwd, '.businesslens')
  if (existsSync(root)) {
    const stat = lstatSync(root)
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error('Refusing to replace a non-directory or symbolic-link .businesslens target.')
    }
    if (readdirSync(root).length > 0) {
      if (!force) throw new Error('.businesslens/ is not empty. Choose an empty target or pass --force to create a backup first.')
      const backup = `${root}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
      renameSync(root, backup)
      console.log(`Backed up the existing product model to ${backup}.`)
    } else {
      rmdirSync(root)
    }
  }
  return root
}

function writeReport(root: string, report: ProductReportV4): void {
  write(join(root, 'config.yaml'), stringify({ schema: 1, sdd: { paths: [] } }, { lineWidth: 0 }))
  write(join(root, '.gitignore'), 'build/\ncache/\n')
  write(
    join(root, 'taxonomies.yaml'),
    stringify({ scenarioKinds: report.model.taxonomies.scenarioKinds }, { lineWidth: 0 })
  )
  write(
    join(root, 'product.md'),
    frontmatter(compactRecord({
      id: report.id,
      tags: report.tags,
      limitations: report.limitations,
      links: links(report.links)
    })) + body(report.title, report.description, report.intent, [], report.supportingContent)
  )
  write(
    join(root, 'coverage.md'),
    frontmatter({
      status: 'draft',
      method: [OPEN_COVERAGE_METHOD],
      sourceAreas: [],
      unmapped: [],
      limitations: [...report.coverage.limitations, OPEN_COVERAGE_LIMITATION]
    }) + body('Coverage', OPEN_COVERAGE_RATIONALE, '', [], '')
  )

  for (const actor of report.model.actors) {
    write(
      join(root, 'actors', `${actor.id}.md`),
      frontmatter(compactRecord({ links: links(actor.links) }))
      + body(actor.name, actor.description, actor.intent, [], actor.supportingContent)
    )
  }
  for (const domain of report.model.domains) {
    write(
      join(root, 'domains', `${domain.id}.md`),
      frontmatter(compactRecord({
        colorSlot: domain.colorSlot,
        links: links(domain.links)
      })) + body(domain.name, domain.description, domain.intent, [], domain.supportingContent)
    )
  }
  for (const experience of report.model.experiences) {
    write(
      join(root, 'experiences', `${experience.id}.md`),
      frontmatter(compactRecord({
        actors: experience.actorIds,
        access: experience.accessMode,
        entryPoints: entryPoints(experience.entryPoints),
        exit: experience.exitContract,
        links: links(experience.links)
      })) + body(
        experience.title,
        experience.description,
        experience.intent,
        [{ heading: 'Capability boundary', content: experience.capabilities }],
        experience.supportingContent
      )
    )
  }
  for (const feature of report.model.features) {
    write(
      join(root, 'features', `${feature.id}.md`),
      frontmatter(compactRecord({
        domain: feature.domainId,
        actors: feature.actorIds,
        experiences: feature.experienceIds,
        businessRules: feature.businessRuleIds,
        links: links(feature.links)
      })) + body(feature.title, feature.description, feature.intent, [], feature.supportingContent)
    )
  }
  for (const rule of report.model.businessRules) {
    write(
      join(root, 'business-rules', `${rule.id}.md`),
      frontmatter(compactRecord({
        domains: rule.domainIds,
        features: rule.featureIds,
        journeys: rule.journeyIds,
        scenarios: rule.scenarioIds,
        links: links(rule.links)
      })) + body(
        rule.title,
        rule.statement,
        rule.intent,
        [{ heading: 'Rationale', content: rule.rationale }],
        rule.supportingContent
      )
    )
  }

  const scenariosByJourney = new Map<string, ProductReportV4['model']['scenarios']>()
  for (const scenario of report.model.scenarios) {
    const current = scenariosByJourney.get(scenario.journeyId) || []
    current.push(scenario)
    scenariosByJourney.set(scenario.journeyId, current)
  }
  for (const journey of report.model.journeys) {
    const journeyRoot = join(root, 'journeys', journey.id)
    write(
      join(journeyRoot, 'journey.md'),
      frontmatter(compactRecord({
        domain: journey.domainId,
        actors: journey.actorIds,
        experiences: journey.experienceIds,
        features: journey.featureIds,
        entryPoints: entryPoints(journey.entryPoints),
        links: links(journey.links)
      })) + body(journey.title, journey.summary, journey.intent, [], journey.supportingContent)
    )
    for (const scenario of scenariosByJourney.get(journey.id) || []) {
      const decisions = scenario.decisionPoints.map(decision =>
        `### ${decision.title}\n\n${decision.question}\n\n${
          decision.branches.map(branch => `- ${branch.condition} → ${branch.outcome}`).join('\n')
        }`
      ).join('\n\n')
      write(
        join(journeyRoot, 'scenarios', `${scenario.id}.md`),
        frontmatter(compactRecord({
          kind: scenario.kindId,
          businessRules: scenario.businessRuleIds,
          links: links(scenario.links)
        })) + body(
          scenario.title,
          '',
          scenario.intent,
          [
            { heading: 'Trigger', content: scenario.trigger },
            { heading: 'Steps', content: scenario.steps.map((step, index) => `${index + 1}. ${step}`).join('\n') },
            { heading: 'Decision points', content: decisions },
            { heading: 'Outcome', content: scenario.outcome },
            { heading: 'Edge cases', content: scenario.edgeCases.map(item => `- ${item}`).join('\n') }
          ],
          scenario.supportingContent
        )
      )
    }
  }
}

export async function runOpen(cwd: string, source: string, force: boolean): Promise<number> {
  let staging: string | undefined
  try {
    const report = parseProductReport(await readReportSource(source))
    const targetParent = dirname(resolve(cwd, '.businesslens'))
    mkdirSync(targetParent, { recursive: true })
    staging = mkdtempSync(join(targetParent, '.businesslens-open-'))
    const stagedRoot = join(staging, '.businesslens')
    writeReport(stagedRoot, report)
    const validation = validateModel(loadModel(staging), [])
    if (!validation.ok) {
      throw new Error(
        `The report cannot be expanded into a valid Product Model:\n${
          validation.errors.map(error => `- ${error}`).join('\n')
        }`
      )
    }
    const root = prepareTarget(cwd, force)
    renameSync(stagedRoot, root)
    console.log(`Opened ${report.title} into ${root}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  } finally {
    if (staging) rmSync(staging, { recursive: true, force: true })
  }
}

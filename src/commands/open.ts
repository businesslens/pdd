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
import { writeGreenfieldAgentBlock } from '../core/agent-block.js'
import type { ProductReportV4 } from '../core/portable.js'
import { validateModel } from './validate.js'
import { loadModel } from '../core/model.js'
import { parseProductReport, redactSourceEvidence } from '../core/portable.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024
const OPEN_COVERAGE_METHOD = 'Opened from a Product Report; source repository evidence was intentionally removed.'
const OPEN_COVERAGE_LIMITATION = 'Implementation evidence must be established in this repository.'
const OPEN_COVERAGE_RATIONALE = 'Product behavior and relationships were imported from a Product Report. Source-repository code references were removed because they are not evidence for this repository.'

function readReportSource(source: string): unknown {
  if (/^https?:\/\//i.test(source)) {
    throw new Error('`open` accepts local Product Report files. Use `businesslens pull <blueprint>` for catalog Blueprints.')
  }
  const file = isAbsolute(source) ? source : resolve(process.cwd(), source)
  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('The report source must be a regular file, not a symbolic link.')
  if (stat.size > MAX_REPORT_BYTES) throw new Error('The report exceeds the 8 MiB safety limit.')
  return JSON.parse(readFileSync(file, 'utf8'))
}

/** Entities with no frontmatter fields get no frontmatter block, not `{}`. */
function frontmatter(data: Record<string, unknown>): string {
  if (!Object.keys(data).length) return ''
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
      // Deduplicated so expansion is idempotent. A Blueprint's committed model is
      // itself an expanded report, so re-expanding it must reproduce the same
      // files byte for byte; an unconditional append accumulated one copy of this
      // limitation per open/pull cycle.
      limitations: report.coverage.limitations.includes(OPEN_COVERAGE_LIMITATION)
        ? [...report.coverage.limitations]
        : [...report.coverage.limitations, OPEN_COVERAGE_LIMITATION]
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

export interface ExpandedProductReport {
  report: ProductReportV4
  root: string
}

export function expandProductReport(cwd: string, input: unknown, force: boolean): ExpandedProductReport {
  let staging: string | undefined
  try {
    const sourceReport = parseProductReport(input)
    const report = parseProductReport(redactSourceEvidence(sourceReport))
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
    return { report, root }
  } finally {
    if (staging) rmSync(staging, { recursive: true, force: true })
  }
}

export async function runOpen(cwd: string, source: string, force: boolean): Promise<number> {
  try {
    const opened = expandProductReport(cwd, readReportSource(source), force)
    // Same reasoning as `pull`: the model arrived from another repository with
    // no implementation, so nothing here tells an agent what it is. Written by
    // the command, not by `expandProductReport` — `contribute` expands into a
    // throwaway checkout that must not grow an AGENTS.md.
    const agentsFile = writeGreenfieldAgentBlock(cwd)
    console.log(`Opened ${opened.report.title} into ${opened.root}.`)
    console.log(`Wrote the greenfield agent block to ${agentsFile}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}

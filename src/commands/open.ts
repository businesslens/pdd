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
import { writeModelReadme } from '../core/model-readme.js'
import type {
  ProductReportV11,
  ReportContext,
  ReportSupportingSection
} from '../core/portable.js'
import { lintModel } from './lint.js'
import { FOLDER_SCHEMA, loadModel } from '../core/model.js'
import { parseProductReport, projectPortableReport } from '../core/portable.js'
import { UsageError } from '../core/usage-error.js'
import { validateProductLogo } from '../logo.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024
const OPEN_COVERAGE_METHOD = 'Opened from a portable Product Report; source-repository navigation was intentionally removed.'
const OPEN_COVERAGE_LIMITATION = 'Implementation alignment must be verified in this repository.'
const OPEN_COVERAGE_RATIONALE = 'Product behavior, relationships, and model breadth were imported from a Product Report. Source-repository references were removed because they do not navigate this repository.'

function readReportSource(source: string): unknown {
  if (/^https?:\/\//i.test(source)) {
    throw new UsageError(
      '`open` accepts local Product Report files. Use `businesslens blueprint pull <blueprint>` for catalog Blueprints.'
    )
  }
  const file = isAbsolute(source) ? source : resolve(process.cwd(), source)
  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('The report source must be a regular file, not a symbolic link.')
  if (stat.size > MAX_REPORT_BYTES) throw new Error('The report exceeds the 8 MiB safety limit.')
  return JSON.parse(readFileSync(file, 'utf8'))
}

/** Elements with no frontmatter fields get no frontmatter block, not `{}`. */
function frontmatter(data: Record<string, unknown>): string {
  if (!Object.keys(data).length) return ''
  return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n`
}

function references(value: ProductReportV11['references']): Array<Record<string, string>> {
  return value.map(reference => ({
    kind: reference.kind,
    role: reference.role,
    target: reference.target,
    ...(reference.title ? { title: reference.title } : {})
  }))
}

function entryPoints(value: Array<{ type: string, path: string }>): Array<Record<string, string>> {
  return value.map(point => ({ [point.type]: point.path }))
}

function contexts(value: ReportContext[]): Array<{ place: string }> {
  return value.map(item => ({ place: item.placeId }))
}

function context(value: ReportContext): { place: string } {
  return { place: value.placeId }
}

/** The path segments of a qualified id: "reader-web::personal-library" -> both. */
function idSegments(id: string): string[] {
  return id.split('::')
}

/**
 * Where a Screen expands to.
 *
 * `interface::screen` sits directly on its Interface; `interface::experience::screen`
 * sits under the Experience. The id carries the whole placement, so nothing else
 * has to be consulted.
 */
function screenPath(root: string, id: string): string {
  const parts = idSegments(id)
  if (parts.length === 3) {
    return join(root, 'interfaces', parts[0]!, 'experiences', parts[1]!, 'screens', `${parts[2]!}.md`)
  }
  return join(root, 'interfaces', parts[0]!, 'screens', `${parts[1]!}.md`)
}

/** Compact until an element needs a namespace for children or assets. */
function elementPath(parent: string, id: string, type: string, expanded: boolean): string {
  return expanded ? join(parent, id, `${type}.md`) : join(parent, `${id}.md`)
}

function compactRecord(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => {
    if (value === undefined || value === null || value === '') return false
    return !Array.isArray(value) || value.length > 0
  }))
}

function body(
  title: string,
  lead: string,
  intent: string,
  sections: Array<{ heading: string, content: string }>,
  supportingSections: ReportSupportingSection[]
): string {
  const blocks = [`# ${title}`, lead]
  if (intent) blocks.push(`## Intent\n\n${intent}`)
  for (const item of sections) {
    if (item.content) blocks.push(`## ${item.heading}\n\n${item.content}`)
  }
  for (const item of supportingSections) {
    blocks.push(`## ${item.heading}${item.content ? `\n\n${item.content}` : ''}`)
  }
  return `${blocks.filter(Boolean).join('\n\n')}\n`
}

function write(path: string, content: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true })
  // Default umask permissions: the expanded model is committed and read by the
  // whole team, so it must not land as owner-only.
  writeFileSync(path, content, { encoding: 'utf8', flag: 'wx' })
}

function writeBytes(path: string, content: Uint8Array): void {
  mkdirSync(resolve(path, '..'), { recursive: true })
  writeFileSync(path, content, { flag: 'wx' })
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

function writeReport(root: string, report: ProductReportV11, hasLogo: boolean): void {
  write(join(root, 'config.yaml'), stringify({ schema: FOLDER_SCHEMA, sdd: { paths: [] } }, { lineWidth: 0 }))
  write(join(root, '.gitignore'), 'build/\ncache/\n')
  write(
    join(root, 'taxonomies.yaml'),
    stringify({ scenarioKinds: report.model.taxonomies.scenarioKinds }, { lineWidth: 0 })
  )
  write(
    hasLogo ? join(root, 'product', 'product.md') : join(root, 'product.md'),
    frontmatter(compactRecord({
      id: report.id,
      summary: report.summary,
      category: report.category,
      tags: report.tags,
      authors: report.authors,
      license: report.license,
      limitations: report.limitations,
      references: references(report.references)
    })) + body(report.title, report.description, report.intent, [], report.supportingSections)
  )
  write(
    join(root, 'coverage.md'),
    frontmatter({
      status: report.coverage.status,
      method: [OPEN_COVERAGE_METHOD],
      sourceAreas: [],
      // Unmapped product areas explain model breadth and survive the
      // source-free projection. Source paths live in sourceAreas, not here.
      // The author's own account of what is unmapped, what the limitations are,
      // and why — never rewritten. It describes the MODEL'S completeness rather
      // than its origin, and it is exactly what a reader receiving a Blueprint
      // needs. Only `method`, which is a claim about how the model was derived,
      // is replaced: a Blueprint carries no claim about its own origin.
      unmapped: report.coverage.unmapped,
      // Deduplicated so expansion is idempotent. A Blueprint's committed model is
      // itself an expanded report, so re-expanding it must reproduce the same
      // files byte for byte; an unconditional append accumulated one copy of this
      // limitation per open/pull cycle.
      limitations: report.coverage.limitations.includes(OPEN_COVERAGE_LIMITATION)
        ? [...report.coverage.limitations]
        : [...report.coverage.limitations, OPEN_COVERAGE_LIMITATION]
    }) + body('Coverage', report.coverage.rationale.trim() || OPEN_COVERAGE_RATIONALE, '', [], [])
  )

  for (const actor of report.model.actors) {
    write(
      elementPath(join(root, 'actors'), actor.id, 'actor', false),
      frontmatter(compactRecord({
        kind: actor.kind,
        relationship: actor.relationship,
        references: references(actor.references)
      }))
      + body(actor.name, actor.description, actor.intent, [], actor.supportingSections)
    )
  }
  for (const productInterface of report.model.interfaces) {
    const hasChildren = report.model.experiences.some(experience => idSegments(experience.id)[0] === productInterface.id)
      || report.model.screens.some(screen => idSegments(screen.id)[0] === productInterface.id)
    write(
      elementPath(join(root, 'interfaces'), productInterface.id, 'interface', hasChildren),
      frontmatter(compactRecord({
        type: productInterface.type,
        actors: productInterface.actorIds,
        entryPoints: entryPoints(productInterface.entryPoints),
        references: references(productInterface.references)
      })) + body(
        productInterface.title,
        productInterface.description,
        productInterface.intent,
        [{ heading: 'Capability boundary', content: productInterface.capabilityBoundary }],
        productInterface.supportingSections
      )
    )
  }
  for (const domain of report.model.domains) {
    write(
      elementPath(join(root, 'domains'), domain.id, 'domain', false),
      frontmatter(compactRecord({
        colorSlot: domain.colorSlot,
        references: references(domain.references)
      })) + body(domain.name, domain.description, domain.intent, [], domain.supportingSections)
    )
  }
  for (const object of report.model.objects) {
    write(
      elementPath(join(root, 'objects'), object.id, 'object', false),
      frontmatter(compactRecord({
        domain: object.domainId,
        references: references(object.references)
      })) + body(object.title, object.description, object.intent, [], [
        { heading: 'States', content: object.states.map(state => `### ${state.name}\n\n${state.content}`).join('\n\n') },
        { heading: 'Transitions', content: object.transitions.map(transition => `- ${transition.from} \u2192 ${transition.to}`).join('\n') },
        ...object.supportingSections
      ])
    )
  }
  for (const experience of report.model.experiences) {
    const [interfaceId, experienceId] = idSegments(experience.id)
    const hasScreens = report.model.screens.some(screen => {
      const parts = idSegments(screen.id)
      return parts.length === 3 && parts[0] === interfaceId && parts[1] === experienceId
    })
    write(
      elementPath(
        join(root, 'interfaces', interfaceId!, 'experiences'),
        experienceId!,
        'experience',
        hasScreens
      ),
      frontmatter(compactRecord({
        actors: experience.actorIds,
        access: experience.accessMode,
        entryPoints: entryPoints(experience.entryPoints),
        references: references(experience.references)
      })) + body(
        experience.title,
        experience.description,
        experience.intent,
        [{ heading: 'Capability boundary', content: experience.capabilityBoundary }],
        experience.supportingSections
      )
    )
  }
  for (const screen of report.model.screens) {
    const states = screen.states.map(state => `### ${state.title}\n\n${state.description}`).join('\n\n')
    write(
      screenPath(root, screen.id),
      frontmatter(compactRecord({
        capabilities: screen.capabilityIds,
        entryPoints: entryPoints(screen.entryPoints),
        references: references(screen.references)
      })) + body(
        screen.title,
        screen.description,
        screen.intent,
        [
          { heading: 'Information presented', content: screen.information.map(item => `- ${item}`).join('\n') },
          { heading: 'Available actions', content: screen.actions.map(item => `- ${item}`).join('\n') },
          { heading: 'Product states', content: states },
          { heading: 'Capability boundary', content: screen.capabilityBoundary }
        ],
        screen.supportingSections
      )
    )
  }
  for (const capability of report.model.capabilities) {
    const hasScenarios = report.model.capabilityScenarios.some(scenario => scenario.capabilityId === capability.id)
    write(
      elementPath(join(root, 'capabilities'), capability.id, 'capability', hasScenarios),
      frontmatter(compactRecord({
        domain: capability.domainId,
        availability: contexts(capability.availability),
        references: references(capability.references)
      })) + body(capability.title, capability.description, capability.intent, [], capability.supportingSections)
    )
  }
  for (const rule of report.model.businessRules) {
    write(
      elementPath(join(root, 'business-rules'), rule.id, 'business-rule', false),
      frontmatter(compactRecord({
        appliesTo: rule.appliesTo.map(target => target.type === 'context'
          ? { type: 'context', context: context(target.context) }
          : compactRecord({
              type: target.type,
              id: target.id,
              contexts: target.contexts.map(context)
            })),
        references: references(rule.references)
      })) + body(
        rule.title,
        rule.statement,
        rule.intent,
        [{ heading: 'Rationale', content: rule.rationale }],
        rule.supportingSections
      )
    )
  }

  const scenarioSections = (
    scenario:
      | ProductReportV11['model']['capabilityScenarios'][number]
      | ProductReportV11['model']['journeyScenarios'][number]
  ) => {
    const decisions = scenario.decisionPoints.map(decision =>
      `### ${decision.title}\n\n${decision.question}\n\n${
        decision.branches.map(branch => `- ${branch.condition} → ${branch.outcome}`).join('\n')
      }`
    ).join('\n\n')
    return [
      { heading: 'Trigger', content: scenario.trigger },
      { heading: 'Decision points', content: decisions },
      { heading: 'Outcome', content: scenario.outcome },
      { heading: 'Edge cases', content: scenario.edgeCases.map(item => `- ${item}`).join('\n') }
    ]
  }

  for (const scenario of report.model.capabilityScenarios) {
    write(
      elementPath(
        join(root, 'capabilities', scenario.capabilityId, 'scenarios'),
        scenario.id,
        'capability-scenario',
        false
      ),
      frontmatter(compactRecord({
        kind: scenario.kindId,
        routes: Object.fromEntries(scenario.routes.map(route => [route.id, route.name])),
        steps: scenario.steps.map(step => compactRecord({
          text: step.text,
          kind: step.kind,
          actor: step.actorId ?? undefined,
          unattended: step.unattended ? true : undefined,
          contexts: step.contexts.length
            ? Object.fromEntries(step.contexts.map(context => [context.routeId, { place: context.placeId }]))
            : undefined
        })),
        references: references(scenario.references)
      })) + body(
        scenario.title,
        '',
        scenario.intent,
        scenarioSections(scenario),
        scenario.supportingSections
      )
    )
  }
  for (const journey of report.model.journeys) {
    const hasScenarios = report.model.journeyScenarios.some(scenario => scenario.journeyId === journey.id)
    write(
      elementPath(join(root, 'journeys'), journey.id, 'journey', hasScenarios),
      frontmatter(compactRecord({
        actors: journey.actorIds,
        references: references(journey.references)
      })) + body(
        journey.title,
        '',
        journey.intent,
        [
          { heading: 'Goal', content: journey.goal },
          { heading: 'Success criterion', content: journey.successCriterion }
        ],
        journey.supportingSections
      )
    )
  }
  for (const scenario of report.model.journeyScenarios) {
    write(
      elementPath(
        join(root, 'journeys', scenario.journeyId, 'scenarios'),
        scenario.id,
        'journey-scenario',
        false
      ),
      frontmatter(compactRecord({
        kind: scenario.kindId,
        result: scenario.result,
        routes: Object.fromEntries(scenario.routes.map(route => [route.id, route.name])),
        steps: scenario.steps.map(step => compactRecord({
          text: step.text,
          kind: step.kind,
          actor: step.actorId ?? undefined,
          unattended: step.unattended ? true : undefined,
          capability: step.capabilityId ?? undefined,
          contexts: step.contexts.length
            ? Object.fromEntries(step.contexts.map(context => [context.routeId, { place: context.placeId }]))
            : undefined
        })),
        references: references(scenario.references)
      })) + body(
        scenario.title,
        '',
        scenario.intent,
        scenarioSections(scenario),
        scenario.supportingSections
      )
    )
  }
}

export interface ExpandedProductReport {
  report: ProductReportV11
  root: string
}

export interface ExpandProductReportOptions {
  /** Optional Product logo to restore into the expanded model. */
  logo?: Uint8Array
}

export function expandProductReport(
  cwd: string,
  input: unknown,
  force: boolean,
  options: ExpandProductReportOptions = {}
): ExpandedProductReport {
  let staging: string | undefined
  try {
    const sourceReport = parseProductReport(input)
    const report = parseProductReport(projectPortableReport(sourceReport))
    const targetParent = dirname(resolve(cwd, '.businesslens'))
    mkdirSync(targetParent, { recursive: true })
    staging = mkdtempSync(join(targetParent, '.businesslens-open-'))
    const stagedRoot = join(staging, '.businesslens')
    writeReport(stagedRoot, report, Boolean(options.logo))
    if (options.logo) {
      const issues = validateProductLogo(options.logo)
      if (issues.length) throw new Error(`The Product logo is invalid: ${issues.join('; ')}`)
      writeBytes(join(stagedRoot, 'product', 'logo.svg'), options.logo)
    }
    // Expansion is the one canonical report-to-model primitive used by open,
    // pull, and contribution. Keeping orientation here makes their model trees
    // identical and lets lint require the complete committed layout.
    writeModelReadme(staging)
    const lint = lintModel(loadModel(staging), [])
    if (!lint.ok) {
      throw new Error(
        `The report cannot be expanded into a structurally sound Product Model:\n${
          lint.errors.map(error => `- ${error}`).join('\n')
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
    console.log(`Opened Blueprint "${opened.report.title}" into ${opened.root}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}

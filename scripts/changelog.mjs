// Pure CHANGELOG.md transformations shared by `changelog-release.mjs` and
// `check-repo.mjs`. Nothing here reads git, GitHub or the file system.

export const REPOSITORY = 'https://github.com/businesslens/pdd'

const RELEASE_HEADING = /^## \[([^\]]+)\]/
const DEFINITION = /^\[([^\]]+)\]: (\S+)$/

/** The `## [label]` sections in file order, each with its line range. */
export function changelogSections(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  lines.forEach((line, index) => {
    const label = RELEASE_HEADING.exec(line)?.[1]
    if (label) sections.push({ label, start: index })
  })
  // A section runs to the next heading, or to the link definitions at the end.
  const definitionsStart = lines.findIndex(line => DEFINITION.test(line))
  sections.forEach((section, index) => {
    section.end = sections[index + 1]?.start ?? (definitionsStart === -1 ? lines.length : definitionsStart)
    section.lines = lines.slice(section.start + 1, section.end)
  })
  return sections
}

/** `[label]: url` definitions, by label. */
export function changelogDefinitions(markdown) {
  return new Map(markdown.split('\n').flatMap((line) => {
    const match = DEFINITION.exec(line)
    return match ? [[match[1], match[2]]] : []
  }))
}

/**
 * The entries of a section: each top-level `- ` item with its continuation
 * lines, located by line index within the section.
 */
export function changelogEntries(sectionLines) {
  const entries = []
  sectionLines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      entries.push({ first: index, last: index, text: line })
    } else if (entries.length && /^ {2,}\S/.test(line) && !/^ {2,}- /.test(line)
      && entries.at(-1).last === index - 1) {
      entries.at(-1).last = index
    }
  })
  return entries
}

const ANNOTATED = /\(\[[0-9a-f]{7}\]\(https:\/\/github\.com\/[^)]+\/commit\/[0-9a-f]+\)\)$/

/**
 * Append the pull request and commit that added each entry of a section, up to
 * its `### Contributors`. Entries already annotated are left as they are.
 * Returns the new lines and the entries `provenance` could not place.
 */
export function annotateEntries(sectionLines, provenance) {
  const lines = [...sectionLines]
  const footer = lines.indexOf('### Contributors')
  const unknown = []
  for (const entry of changelogEntries(footer === -1 ? lines : lines.slice(0, footer))) {
    if (ANNOTATED.test(lines[entry.last])) continue
    const source = provenance(entry.text)
    if (!source) {
      unknown.push(entry.text)
      continue
    }
    const pr = source.pr ? ` ([#${source.pr}](${REPOSITORY}/pull/${source.pr}))` : ''
    lines[entry.last] += `${pr} ([${source.sha.slice(0, 7)}](${REPOSITORY}/commit/${source.sha}))`
  }
  return { lines, unknown }
}

/**
 * Release problems `check-repo` reports: a released section must close with
 * its contributors and the full comparison, and every heading needs its link.
 */
export function changelogProblems(markdown) {
  const problems = []
  const definitions = changelogDefinitions(markdown)
  for (const section of changelogSections(markdown)) {
    if (!definitions.has(section.label)) {
      problems.push(`heading [${section.label}] has no link definition`)
    }
    if (section.label === 'Unreleased') continue
    if (!section.lines.includes('### Contributors')) {
      problems.push(`[${section.label}] has no ### Contributors list`)
    }
    if (!section.lines.some(line => line.startsWith('**Full Changelog**: '))) {
      problems.push(`[${section.label}] has no **Full Changelog** line`)
    }
  }
  return problems
}

/** `v0.23.1...v0.24.0` from a compare URL, or the tag from a tag URL. */
function comparisonText(url) {
  return url.split('/compare/')[1] ?? url.split('/').at(-1)
}

/**
 * Roll `[Unreleased]` into `version`. Every entry is annotated with the pull
 * request and commit that added it, then the section closes with its
 * contributors and the full comparison, and the link definitions move on.
 *
 * `provenance(entryText)` returns `{ pr?: number, sha: string }` for an entry's
 * first line, or `undefined` when no merged commit added it; such entries are
 * refused rather than guessed, because a release PR cannot know its own hash.
 */
export function rollUnreleased(markdown, { version, date, provenance, contributors }) {
  const sections = changelogSections(markdown)
  const unreleased = sections.find(section => section.label === 'Unreleased')
  if (!unreleased) throw new Error('CHANGELOG.md has no [Unreleased] section')
  if (sections.some(section => section.label === version)) {
    throw new Error(`CHANGELOG.md already has a [${version}] section`)
  }
  const previous = sections.find(section => section.label !== 'Unreleased')?.label
  if (!previous) throw new Error('CHANGELOG.md has no earlier release to compare against')

  if (!changelogEntries(unreleased.lines).length) throw new Error('[Unreleased] has no entries to release')

  const { lines: body, unknown } = annotateEntries(unreleased.lines, provenance)
  if (unknown.length) {
    throw new Error(`These entries were not added by a merged pull request, so they have no commit yet:\n${unknown.map(text => `  ${text}`).join('\n')}`)
  }
  if (!contributors.length) throw new Error(`No contributors were found for ${version}`)

  while (body.length && !body.at(-1).trim()) body.pop()
  while (body.length && !body[0].trim()) body.shift()
  const comparison = `v${previous}...v${version}`
  const released = [
    `## [${version}] - ${date}`,
    '',
    ...body,
    '',
    ...releaseFooter(version, `${REPOSITORY}/compare/${comparison}`, contributors),
    ''
  ]

  const lines = markdown.split('\n')
  lines.splice(unreleased.start, unreleased.end - unreleased.start, '## [Unreleased]', '', ...released)

  return lines.join('\n')
    .replace(/^\[Unreleased\]: .*$/m, `[Unreleased]: ${REPOSITORY}/compare/v${version}...HEAD\n[${version}]: ${REPOSITORY}/compare/${comparison}`)
}

/** The closing lines `rollUnreleased` writes, for a release rolled before it. */
export function releaseFooter(label, url, contributors) {
  return [
    '### Contributors',
    '',
    ...contributors.map(login => `- [@${login}](https://github.com/${login})`),
    '',
    `**Full Changelog**: [${comparisonText(url)}][${label}]`
  ]
}

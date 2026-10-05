import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { annotateEntries, changelogProblems, rollUnreleased } from '../scripts/changelog.mjs'

const SHA = '0784f6a3c1d2e5f60718293a4b5c6d7e8f901234'

const unreleased = `# Changelog

## [Unreleased]

### Added

- Offer CLI updates once per release.
- Read every Variation under its name,
  in every reading.

## [0.24.0] - 2026-10-05

- Earlier release.

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.23.1...v0.24.0][0.24.0]

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.24.0...HEAD
[0.24.0]: https://github.com/businesslens/pdd/compare/v0.23.1...v0.24.0
`

describe('rollUnreleased', () => {
  it('annotates each entry with its pull request and commit and closes the release', () => {
    const rolled = rollUnreleased(unreleased, {
      version: '0.25.0',
      date: '2026-10-12',
      provenance: text => text.startsWith('- Offer') ? { pr: 77, sha: SHA } : { sha: SHA },
      contributors: ['itai-gendler']
    })

    expect(rolled).toBe(`# Changelog

## [Unreleased]

## [0.25.0] - 2026-10-12

### Added

- Offer CLI updates once per release. ([#77](https://github.com/businesslens/pdd/pull/77)) ([0784f6a](https://github.com/businesslens/pdd/commit/${SHA}))
- Read every Variation under its name,
  in every reading. ([0784f6a](https://github.com/businesslens/pdd/commit/${SHA}))

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.24.0...v0.25.0][0.25.0]

## [0.24.0] - 2026-10-05

- Earlier release.

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.23.1...v0.24.0][0.24.0]

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.25.0...HEAD
[0.25.0]: https://github.com/businesslens/pdd/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/businesslens/pdd/compare/v0.23.1...v0.24.0
`)
    expect(changelogProblems(rolled)).toEqual([])
  })

  it('refuses an entry no merged commit added', () => {
    expect(() => rollUnreleased(unreleased, {
      version: '0.25.0',
      date: '2026-10-12',
      provenance: text => text.startsWith('- Offer') ? { pr: 77, sha: SHA } : undefined,
      contributors: ['itai-gendler']
    })).toThrow(/not added by a merged pull request[\s\S]*Read every Variation/)
  })

  it('refuses an empty or already released version', () => {
    const options = { date: '2026-10-12', provenance: () => ({ sha: SHA }), contributors: ['itai-gendler'] }
    expect(() => rollUnreleased(unreleased, { ...options, version: '0.24.0' })).toThrow(/already has a \[0.24.0\]/)
    const empty = unreleased.replace(/### Added[\s\S]*?(?=## \[0\.24\.0\])/, '')
    expect(() => rollUnreleased(empty, { ...options, version: '0.25.0' })).toThrow(/no entries/)
  })
})

describe('annotateEntries', () => {
  it('links a released section\'s entries and leaves its contributors alone', () => {
    const { lines, unknown } = annotateEntries([
      '',
      '- Earlier release.',
      '',
      '### Contributors',
      '',
      '- [@itai-gendler](https://github.com/itai-gendler)'
    ], () => ({ pr: 71, sha: SHA }))

    expect(unknown).toEqual([])
    expect(lines[1]).toBe(`- Earlier release. ([#71](https://github.com/businesslens/pdd/pull/71)) ([0784f6a](https://github.com/businesslens/pdd/commit/${SHA}))`)
    expect(lines[5]).toBe('- [@itai-gendler](https://github.com/itai-gendler)')
    expect(annotateEntries(lines, () => ({ sha: '1'.repeat(40) })).lines).toEqual(lines)
  })
})

describe('changelogProblems', () => {
  it('names a release without its contributors, comparison, or link', () => {
    const broken = unreleased
      .replace(/### Contributors\n\n- \[@itai-gendler\]\(https:\/\/github.com\/itai-gendler\)\n\n/, '')
      .replace(/\[0\.24\.0\]: .*\n/, '')
    expect(changelogProblems(broken)).toEqual([
      'heading [0.24.0] has no link definition',
      '[0.24.0] has no ### Contributors list'
    ])
  })

  it('accepts the repository changelog', () => {
    expect(changelogProblems(readFileSync(join(__dirname, '..', 'CHANGELOG.md'), 'utf8'))).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { collapseShortcutReferences } from '../../config/markdownReferences'

describe('collapseShortcutReferences', () => {
  it('collapses a defined shortcut reference in a release heading', () => {
    const markdown = '## [0.23.1] - 2026-10-04\n\n[0.23.1]: https://example.com/v0.23.1\n'
    expect(collapseShortcutReferences(markdown))
      .toBe('## [0.23.1][] - 2026-10-04\n\n[0.23.1]: https://example.com/v0.23.1\n')
  })

  it('matches labels case-insensitively, as CommonMark does', () => {
    expect(collapseShortcutReferences('## [Unreleased]\n\n[unreleased]: https://example.com\n'))
      .toBe('## [Unreleased][]\n\n[unreleased]: https://example.com\n')
  })

  it('leaves undefined labels, links, full references, and code alone', () => {
    const markdown = [
      '## [0.1.0] - [draft]',
      'A [link](https://example.com), a [full][0.1.0] and a [collapsed][] reference.',
      'An escaped \\[0.1.0] and `[0.1.0]` in code.',
      '```',
      '[0.1.0]',
      '```',
      '',
      '[0.1.0]: https://example.com',
      '[collapsed]: https://example.com'
    ].join('\n')

    expect(collapseShortcutReferences(markdown)).toBe(markdown.replace('## [0.1.0] -', '## [0.1.0][] -'))
  })

  it('returns a document without definitions unchanged', () => {
    expect(collapseShortcutReferences('## [0.1.0]\n')).toBe('## [0.1.0]\n')
  })
})

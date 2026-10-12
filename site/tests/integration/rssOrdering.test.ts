import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

function feedsInLocale(locale: string) {
  const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import { buildBlogFeed } from './server/utils/rss.ts'
    import { buildBlueprintFeed } from './server/utils/blueprintRss.ts'

    const slugs = ['zebra', 'aardvark']
    const date = '2026-09-01T00:00:00Z'
    console.log(JSON.stringify({
      locale: Intl.Collator().resolvedOptions().locale,
      blog: buildBlogFeed({ posts: slugs.map(slug => ({
        path: '/blog/' + slug, title: slug, date
      })) }).xml,
      blueprints: buildBlueprintFeed(slugs.map((slug, index) => ({
        id: '4d2ac8fb-a156-4f10-9b77-dc81b3e5d63' + index,
        slug, title: slug, summary: 'Example.', category: 'productivity',
        publishedAt: new Date(date), updatedAt: new Date(date)
      })))
    }))
  `], {
    cwd: new URL('../../', import.meta.url),
    env: { ...process.env, LANG: locale, LC_ALL: locale },
    encoding: 'utf8',
    timeout: 10_000
  })
  return JSON.parse(output) as { locale: string, blog: string, blueprints: string }
}

it('keeps tied feed entries byte-identical across runtime locales', () => {
  // Danish treats "aa" differently even though both slugs contain only ASCII.
  const english = feedsInLocale('en_US.UTF-8')
  const danish = feedsInLocale('da_DK.UTF-8')

  expect(english.locale).not.toBe(danish.locale)
  expect(english.blog).toBe(danish.blog)
  expect(english.blueprints).toBe(danish.blueprints)
})

import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { describe, expect, it, vi } from 'vitest'
import { buildBlogFeed, type FeedPost } from '../../server/utils/rss'

/**
 * The feed is the one surface that leaves this origin as a file, so these tests
 * hold two lines: the XML must parse, and the HTML inside `content:encoded` must
 * make sense to a reader that has never loaded this site's stylesheet.
 */

function feed(posts: FeedPost[]) {
  return buildBlogFeed({ posts })
}

function parse(xml: string) {
  expect(XMLValidator.validate(xml)).toBe(true)

  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    // Titles and dates must come back as the strings they were written as.
    parseTagValue: false
  }).parse(xml)

  const channel = parsed.rss.channel
  const items = channel.item === undefined
    ? []
    : (Array.isArray(channel.item) ? channel.item : [channel.item])

  return { channel, items }
}

function post(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    path: '/blog/a-post',
    title: 'A post',
    description: 'A description.',
    date: '2026-08-06',
    body: { type: 'minimark', value: [['p', {}, 'Body text.']] },
    ...overrides
  }
}

describe('blog feed channel', () => {
  it('carries the elements a reader and the W3C validator both expect', () => {
    const { channel } = parse(feed([post()]).xml)

    expect(channel.title).toBe('pdd-kit Blog')
    expect(channel.link).toBe('https://pdd-kit.dev/blog')
    expect(channel.language).toBe('en')
    expect(channel.lastBuildDate).toBeUndefined()
    // Without rel="self" the validator warns and some readers cannot re-resolve
    // a feed they were handed by URL.
    expect(channel['atom:link']['@href']).toBe('https://pdd-kit.dev/blog/rss.xml')
    expect(channel['atom:link']['@rel']).toBe('self')
    expect(channel['atom:link']['@type']).toBe('application/rss+xml')
  })

  it('takes its pubDate from the newest post', () => {
    const { channel } = parse(feed([
      post({ path: '/blog/old', date: '2026-08-06' }),
      post({ path: '/blog/new', date: '2026-08-13' })
    ]).xml)

    expect(channel.pubDate).toBe('Thu, 13 Aug 2026 00:00:00 GMT')
  })

  it('stays valid with no publishable posts', () => {
    const { channel, items } = parse(feed([]).xml)

    expect(items).toHaveLength(0)
    expect(channel.pubDate).toBeUndefined()
    expect(channel.lastBuildDate).toBeUndefined()
  })

  it('keeps unchanged and empty feeds byte-identical as time passes', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-09-01T00:00:00Z'))
      const original = feed([post()]).xml
      const empty = feed([]).xml
      vi.setSystemTime(new Date('2026-09-02T00:00:00Z'))
      expect(feed([post()]).xml).toBe(original)
      expect(feed([]).xml).toBe(empty)
      expect(feed([post({ description: 'Edited after publication.' })]).xml).not.toBe(original)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('blog feed items', () => {
  it('maps a post to absolute links, an RFC 822 date, authors, and a category', () => {
    const { items } = parse(feed([post({
      path: '/blog/introducing-pdd-kit',
      title: 'Introducing pdd-kit',
      date: '2026-08-13',
      badge: 'Launch',
      authors: [{ name: 'Itai Gendler' }, { name: 'A Second Author' }]
    })]).xml)

    expect(items[0].link).toBe('https://pdd-kit.dev/blog/introducing-pdd-kit')
    expect(items[0].guid['#text']).toBe('https://pdd-kit.dev/blog/introducing-pdd-kit')
    expect(items[0].guid['@isPermaLink']).toBe('true')
    expect(items[0].pubDate).toBe('Thu, 13 Aug 2026 00:00:00 GMT')
    expect(items[0].category).toBe('Launch')
    // dc:creator rather than <author>, which RSS reserves for an email address.
    expect(items[0]['dc:creator']).toEqual(['Itai Gendler', 'A Second Author'])
  })

  it('exposes the frontmatter cover as image metadata and the leading article image', () => {
    const { items } = parse(feed([post({
      title: 'A post',
      image: '/brand/heroes/product-model-wide.webp'
    })]).xml)

    expect(items[0]['content:encoded']).toContain(
      '<img src="https://pdd-kit.dev/brand/heroes/product-model-wide.webp" alt="A post" />'
    )
    expect(items[0]['media:content']).toEqual({
      '@url': 'https://pdd-kit.dev/brand/heroes/product-model-wide.webp',
      '@medium': 'image'
    })
    expect(items[0]['media:thumbnail']).toEqual({
      '@url': 'https://pdd-kit.dev/brand/heroes/product-model-wide.webp'
    })
  })

  it('escapes image metadata URLs without losing query parameters', () => {
    const { items } = parse(feed([post({ image: '/blog/cover.webp?width=800&height=450' })]).xml)
    expect(items[0]['media:thumbnail']['@url']).toBe(
      'https://pdd-kit.dev/blog/cover.webp?width=800&height=450'
    )
  })

  it.each([undefined, '', 'javascript:alert(1)', 'data:image/png;base64,abc', 'mailto:author@example.com'])(
    'omits missing or non-HTTP cover images: %s', (image) => {
      const { items } = parse(feed([post({ image })]).xml)
      expect(items[0]['media:content']).toBeUndefined()
      expect(items[0]['media:thumbnail']).toBeUndefined()
      expect(items[0]['content:encoded']).toBe('<p>Body text.</p>')
    }
  )

  it('updates cover metadata while preserving the article identity and publication date', () => {
    const original = parse(feed([post({ image: '/blog/old.webp' })]).xml).items[0]
    const updated = parse(feed([post({ image: '/blog/new.webp' })]).xml).items[0]
    expect(updated['media:thumbnail']['@url']).toBe('https://pdd-kit.dev/blog/new.webp')
    expect(updated.guid).toEqual(original.guid)
    expect(updated.pubDate).toBe(original.pubDate)
  })

  it('omits an author, category, and description a post does not have', () => {
    const { items } = parse(feed([post({ description: undefined, badge: undefined })]).xml)

    expect(items[0]['dc:creator']).toBeUndefined()
    expect(items[0].category).toBeUndefined()
    expect(items[0].description).toBeUndefined()
    expect(items[0].title).toBe('A post')
  })
})

describe('blog feed ordering', () => {
  it('sorts newest first', () => {
    const { items } = parse(feed([
      post({ path: '/blog/middle', date: '2026-08-09' }),
      post({ path: '/blog/oldest', date: '2026-08-06' }),
      post({ path: '/blog/newest', date: '2026-08-13' })
    ]).xml)

    expect(items.map((item: { link: string }) => item.link)).toEqual([
      'https://pdd-kit.dev/blog/newest',
      'https://pdd-kit.dev/blog/middle',
      'https://pdd-kit.dev/blog/oldest'
    ])
  })

  it('breaks a shared date by URL so two launch-day posts do not churn between builds', () => {
    const sameDay = [
      post({ path: '/blog/zebra', date: '2026-08-13' }),
      post({ path: '/blog/alpha', date: '2026-08-13' })
    ]

    const forwards = parse(feed(sameDay).xml).items
    const backwards = parse(feed([...sameDay].reverse()).xml).items

    expect(forwards.map((item: { link: string }) => item.link)).toEqual([
      'https://pdd-kit.dev/blog/alpha',
      'https://pdd-kit.dev/blog/zebra'
    ])
    expect(backwards.map((item: { link: string }) => item.link)).toEqual(
      forwards.map((item: { link: string }) => item.link)
    )
  })
})

describe('blog feed validation', () => {
  it('skips a post with an unparseable date and says which', () => {
    const { xml, skipped } = feed([
      post({ path: '/blog/broken', date: 'the thirteenth' }),
      post({ path: '/blog/fine' })
    ])

    expect(skipped).toEqual([
      { path: '/blog/broken', reason: 'unparseable date "the thirteenth"' }
    ])
    expect(parse(xml).items).toHaveLength(1)
  })

  it('skips a post with no title and a post with no path', () => {
    const { skipped } = feed([
      post({ path: '/blog/untitled', title: '   ' }),
      post({ path: undefined, title: 'Pathless' })
    ])

    expect(skipped).toEqual([
      { path: '/blog/untitled', reason: 'missing a title' },
      { path: 'Pathless', reason: 'missing an absolute path' }
    ])
  })

  it('accepts the Date object a YAML parser may hand back for an unquoted date', () => {
    const { items } = parse(feed([
      post({ date: new Date('2026-08-13T00:00:00Z') as unknown as string })
    ]).xml)

    expect(items[0].pubDate).toBe('Thu, 13 Aug 2026 00:00:00 GMT')
  })
})

describe('blog feed escaping', () => {
  it('escapes XML-sensitive characters in titles and descriptions', () => {
    const { xml, items } = (() => {
      const built = feed([post({
        title: 'Ampersands & <angle brackets> in "titles"',
        description: 'List<T> & literal &copy; <em>tags</em>'
      })])
      return { xml: built.xml, ...parse(built.xml) }
    })()

    expect(xml).toContain('<title>Ampersands &amp; &lt;angle brackets&gt; in "titles"</title>')
    // Titles are plain XML text; descriptions must still be safe HTML after
    // XML decoding, because readers render them as markup.
    expect(items[0].title).toBe('Ampersands & <angle brackets> in "titles"')
    expect(items[0].description).toBe('List&lt;T&gt; &amp; literal &amp;copy; &lt;em&gt;tags&lt;/em&gt;')
  })

  it('keeps Unicode intact', () => {
    const { items } = parse(feed([post({
      title: 'AI is writing code for products it doesn’t understand — really',
      body: { type: 'minimark', value: [['p', {}, 'Café — naïve — 日本語 — 🌍']] }
    })]).xml)

    expect(items[0].title).toBe('AI is writing code for products it doesn’t understand — really')
    expect(items[0]['content:encoded']).toContain('Café — naïve — 日本語 — 🌍')
  })

  it('survives a CDATA terminator inside the body', () => {
    const { xml, items } = (() => {
      const built = feed([post({
        body: { type: 'minimark', value: [['p', {}, 'An array index like a[b[c]]> ends a section.']] }
      })])
      return { xml: built.xml, ...parse(built.xml) }
    })()

    expect(xml).toContain(']]]]><![CDATA[>')
    expect(items[0]['content:encoded']).toContain('a[b[c]]> ends a section.')
  })

  it('drops control characters XML cannot represent', () => {
    const { items } = parse(feed([post({ title: 'A\u0000 post\u0008' })]).xml)

    expect(items[0].title).toBe('A post')
  })

  it.each(['\uFFFE', '\uFFFF', '\uD800', '\uDC00'])(
    'removes an invalid XML character from metadata and article HTML: %j', (character) => {
      const text = `Café${character} 🌍`
      const { xml } = feed([post({
        title: text,
        description: text,
        image: '/blog/cover.webp',
        body: { type: 'minimark', value: [['p', {}, text]] }
      })])

      // fast-xml-parser accepts these forbidden characters, so its validator
      // alone cannot catch a feed that a strict XML reader will reject.
      expect(xml).not.toContain(character)
      const { items } = parse(xml)
      expect(items[0].title).toBe('Café 🌍')
      expect(items[0].description).toBe('Café 🌍')
      expect(items[0]['content:encoded']).toContain('alt="Café 🌍"')
      expect(items[0]['content:encoded']).toContain('<p>Café 🌍</p>')
    }
  )
})

describe('blog feed content rendering', () => {
  it('preserves empty alt text on decorative images', () => {
    const { items } = parse(feed([post({
      body: {
        type: 'minimark',
        value: [['img', { src: '/blog/decoration.webp', alt: '' }]]
      }
    })]).xml)

    expect(items[0]['content:encoded']).toContain(
      '<img src="https://pdd-kit.dev/blog/decoration.webp" alt="">'
    )
  })

  it('escapes markup characters that appear as body text', () => {
    const { items } = parse(feed([post({
      body: { type: 'minimark', value: [['p', {}, 'Generics look like Map<string, number> & friends.']] }
    })]).xml)

    expect(items[0]['content:encoded']).toContain(
      '<p>Generics look like Map&#x3C;string, number> &#x26; friends.</p>'
    )
  })

  it('resolves relative links and images against the article URL', () => {
    const { items } = parse(feed([post({
      path: '/blog/a-post',
      body: {
        type: 'minimark',
        value: [
          ['p', {}, ['a', { href: '/blog/your-agent-is-guessing' }, 'another post']],
          ['p', {}, ['a', { href: '#a-heading' }, 'a section']],
          ['p', {}, ['a', { href: 'https://github.com/itai-gendler/pdd-kit' }, 'the repository']],
          ['img', { src: '/blog/diagram.webp', alt: 'A diagram' }]
        ]
      }
    })]).xml)

    const content = items[0]['content:encoded']
    expect(content).toContain('href="https://pdd-kit.dev/blog/your-agent-is-guessing"')
    expect(content).toContain('href="https://pdd-kit.dev/blog/a-post#a-heading"')
    expect(content).toContain('href="https://github.com/itai-gendler/pdd-kit"')
    expect(content).toContain('src="https://pdd-kit.dev/blog/diagram.webp"')
  })

  it('drops a link whose scheme should not travel to a reader', () => {
    const { items } = parse(feed([post({
      body: {
        type: 'minimark',
        value: [
          ['p', {}, ['a', { href: 'javascript:alert(1)' }, 'do not follow']],
          ['p', {}, ['a', { href: 'mailto:itai@pdd-kit.dev' }, 'do write']]
        ]
      }
    })]).xml)

    const content = items[0]['content:encoded']
    // The anchor survives without its href; the text it carried is not lost.
    expect(content).toContain('<a>do not follow</a>')
    expect(content).not.toContain('javascript:')
    expect(content).toContain('href="mailto:itai@pdd-kit.dev"')
  })

  it('rebuilds a highlighted code block from its source and drops the Shiki markup', () => {
    const { items } = parse(feed([post({
      body: {
        type: 'minimark',
        value: [[
          'pre',
          {
            className: 'language-yaml shiki shiki-themes pdd-kit-brand-warm',
            code: 'links:\n  - rel: spec\n',
            language: 'yaml'
          },
          ['code', { __ignoreMap: '' },
            ['span', { class: 'line', line: 1 },
              ['span', { class: 'sg1QC' }, 'links'],
              ['span', { class: 'sjkiA' }, ':\n']]]
        ]]
      }
    })]).xml)

    const content = items[0]['content:encoded']
    expect(content).toContain('<pre><code class="language-yaml">links:\n  - rel: spec</code></pre>')
    // The class names index this site's stylesheet and mean nothing in a reader.
    expect(content).not.toContain('sg1QC')
    expect(content).not.toContain('shiki')
  })

  it('drops the generated Shiki stylesheet rather than shipping it as content', () => {
    const { items } = parse(feed([post({
      body: {
        type: 'minimark',
        value: [
          ['style', {}, 'html pre.shiki code .sg1QC{--shiki-light:#00585F}'],
          ['p', {}, 'Prose that should survive.']
        ]
      }
    })]).xml)

    expect(items[0]['content:encoded']).not.toContain('--shiki-light')
    expect(items[0]['content:encoded']).toContain('Prose that should survive.')
  })

  it('unwraps an unknown MDC component instead of losing its prose', () => {
    const { items } = parse(feed([post({
      body: {
        type: 'minimark',
        value: [['note', { type: 'warning' }, ['p', {}, 'Text inside a component.']]]
      }
    })]).xml)

    expect(items[0]['content:encoded']).toContain('<p>Text inside a component.</p>')
    expect(items[0]['content:encoded']).not.toContain('<note')
  })

  it('renders nothing rather than throwing on a body it does not recognise', () => {
    const { items } = parse(feed([
      post({ path: '/blog/no-body', body: undefined }),
      post({ path: '/blog/wrong-shape', body: { type: 'markdown', value: 'raw' } })
    ]).xml)

    expect(items).toHaveLength(2)
    for (const item of items) {
      expect(item['content:encoded']).toBeUndefined()
    }
  })
})

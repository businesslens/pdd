import { describe, expect, it } from 'vitest'
import { homeContent } from '../../app/utils/homeContent'

/**
 * The home page is three sections with one job each, and two of them are
 * inventories built to be read against one another. That is a content
 * invariant, not a layout one, so it is checked here rather than in a browser:
 * the page can look perfect and still be wrong.
 *
 * The pairing of a problem with its answer is no longer checked at all — a
 * `ComparisonRow` holds both halves, so a cost that loses its answer is
 * unrepresentable rather than merely tested for. What is left is what the type
 * cannot express: counts and lengths.
 */
describe('the home page argument', () => {
  // Found by id rather than by position: the order is a decision the page makes
  // and has already changed once, and a reorder should not fail assertions that
  // are not about order.
  const find = (id: string) => homeContent.sections.find(section => section.id === id)!
  const today = find('today')
  const model = find('product-model')
  const { comparison, loop } = homeContent

  it('keeps em and en dashes out of visible homepage copy', () => {
    expect(JSON.stringify(homeContent)).not.toMatch(/[—–]/)
  })

  it('uses sentence case for product model in prose', () => {
    const capitalizedUses = JSON.stringify(homeContent)
      .match(/"[^"]*Product Models?[^"]*"/g) ?? []

    expect(new Set(capitalizedUses)).toEqual(new Set(['"Product Model"']))
  })

  it('introduces the seven main collections', () => {
    expect(model.items.map(item => item.title)).toEqual(['Entities', 'Interfaces', 'Domains', 'Capabilities', 'Journeys', 'Business rules', 'Variations'])
  })

  it('runs two inventories and one comparison', () => {
    expect(homeContent.sections).toHaveLength(2)
    expect(today.tone).toBe('negative')
    expect(model.tone).toBe('positive')
    expect(comparison.rows.length).toBeGreaterThan(0)
  })

  it('defines the artifact before asking where the reader keeps one', () => {
    // The page's order, and the one thing about it that is load-bearing:
    // "Where is your product model today?" only lands as a question if the reader
    // already knows what is being asked for.
    expect(homeContent.sections.map(section => section.id))
      .toEqual(['product-model', 'today'])
  })

  it('never leaves a card alone in the last row', () => {
    // The two counts are no longer equal and cannot be made so: Today's places
    // are a rhetorical list, the resource types are whatever the format defines.
    // Seven collections divide by no useful column count, and the panel centres
    // a short last row. What still has to hold is that the short row is a row:
    // a remainder of one is an orphan card alone under a full line.
    for (const section of homeContent.sections) {
      expect(section.items.length % section.columns, `${section.id} leaves an orphan card`)
        .not.toBe(1)
    }
  })

  /**
   * Today's cards carry the brand marks of the products each place is actually
   * kept in; the Product Model's carry none, because a resource type is an idea no
   * vendor ships. The marks are what make the section an inventory of tabs the
   * reader has open rather than a list of nouns.
   */
  it('shows Today in the products it is kept in, and the resource types in none', () => {
    for (const item of today.items) {
      expect(item.logos?.length, `${item.title} names no product`).toBeGreaterThan(0)
      // Three is what the title's line has room for at the width four columns
      // are read — a fourth mark pushes into the heading.
      expect(item.logos!.length, `${item.title} carries more marks than fit`).toBeLessThanOrEqual(3)
    }

    for (const item of model.items) {
      expect(item.logos, `${item.title} is an idea, not a product`).toBeUndefined()
    }

    // A mark under two headings says the headings overlap, which is the
    // opposite of what eight separate places are here to show.
    const marks = today.items.flatMap(item => item.logos ?? [])
    expect(new Set(marks.map(mark => mark.icon)).size, 'a product appears under two places')
      .toBe(marks.length)
    expect(new Set(marks.map(mark => mark.name)).size, 'two marks answer to one name')
      .toBe(marks.length)
  })

  /**
   * Every mark is named and, bar one, linked. The name is the tooltip and the
   * link's accessible name both — a tooltip is `aria-describedby` and never
   * names the thing it hangs off, so a mark without one is a link a screen
   * reader announces as nothing at all.
   */
  it('names every mark and sends it somewhere off this site', () => {
    for (const mark of today.items.flatMap(item => item.logos ?? [])) {
      expect(mark.name.trim(), `${mark.icon} is unnamed`).not.toBe('')

      // People's glyph is the one mark with no vendor behind it, and the only
      // one allowed to stay a picture.
      if (mark.icon === 'i-lucide-users') {
        expect(mark.to, 'People\'s glyph links somewhere').toBeUndefined()
        continue
      }

      // Absolute and https: these open in a new tab, and a relative href there
      // would resolve against this site and land on a 404.
      expect(mark.to, `${mark.name} goes nowhere`).toMatch(/^https:\/\//)
    }
  })

  /**
   * The mirror of the assertion above, and the reason it exists: the resource
   * types carry no logos because nobody ships one, so the engraved plates are
   * the only thing they have to show. One added without a plate is a hole in the
   * grid on every treatment but the control — and because the control is the
   * default, nothing on the page would go red to say so.
   *
   * The list of undrawn types is asserted exactly rather than skipped, so a card
   * cannot join the section quietly. It is empty: `Entities` was the last
   * exemption, held open until its plate replaced the retired Actors one.
   */
  it('draws every resource type, and no place in Today', () => {
    const undrawn = model.items.filter(item => !item.emblem).map(item => item.title)
    expect(undrawn, 'a resource type is missing its plate').toEqual([])

    for (const item of model.items.filter(item => item.emblem)) {
      expect(item.emblem, `${item.title} has no plate drawn for it`)
        .toMatch(/^\/brand\/icons\/resource-types\/[a-z-]+\.webp$/)
    }

    // One plate under two resource types says the two are the same thing, which
    // is the opposite of what a list of distinct types is here to show.
    const plates = model.items.map(item => item.emblem).filter(Boolean)
    expect(new Set(plates).size, 'a resource type borrows another\'s plate').toBe(plates.length)

    for (const item of today.items) {
      expect(item.emblem, `${item.title} is a product, not a resource type`).toBeUndefined()
    }
  })

  /**
   * Every resource type card is a route into the documentation, and `HomeCard` spends
   * that on the whole card — one link stretched over the box.
   *
   * Which makes the second half of this test the load-bearing one. A Today card
   * carries up to three links of its own, so a card that had both would nest a
   * link inside a link: invalid markup, and an accessibility failure the axe
   * scan would only catch once someone rendered it. The two shapes are kept
   * mutually exclusive here instead.
   */
  it('sends every resource type to its documentation, and never nests a link', () => {
    for (const item of model.items) {
      expect(item.to, `${item.title} goes nowhere`).toMatch(/^\/docs\/[a-z-]+$/)
    }

    // Two resource types sharing a page says the two are the same thing.
    const pages = model.items.map(item => item.to)
    expect(new Set(pages).size, 'two resource types open the same page').toBe(pages.length)

    // A card is either one link over its face, or a card holding several.
    for (const item of model.items) {
      expect(item.logos, `${item.title} would nest a link inside a link`).toBeUndefined()
    }
    for (const item of today.items) {
      expect(item.to, `${item.title} would nest a link inside a link`).toBeUndefined()
    }
  })

  /**
   * Every box of information says where it continues, in one place and one
   * treatment. The type makes `more` required on each, so what is left to check
   * is what it cannot express: that the label matches the kind of place it opens
   * — the corner is set in one mono line and reads as a standard, which it stops
   * being the moment a box invents a third label — and that no two boxes send
   * the reader to the same page.
   *
   * The close is not among them and carries no `more` at all. It is a sub-hero
   * whose one job is the button under it, and a second route out of it competes
   * with the only offer the page makes.
   */
  it('sends every box of the page somewhere different, and says which kind of place', () => {
    const boxes = [...homeContent.sections, comparison, loop]
    const LABELS = { '/docs': 'View in docs', '/blog': 'Read blog' } as const

    for (const box of boxes) {
      const kind = (Object.keys(LABELS) as (keyof typeof LABELS)[])
        .find(prefix => box.more.to.startsWith(prefix) && /^(?:$|[/#])/.test(box.more.to.slice(prefix.length)))

      expect(kind, `${box.more.label} leads off the docs and the blog both`).toBeDefined()
      expect(box.more.label, `the corner says "${box.more.label}" of a ${kind} page`)
        .toBe(LABELS[kind!])
    }

    const targets = boxes.map(box => box.more.to)
    expect(new Set(targets).size, 'two boxes continue in the same place').toBe(targets.length)
  })

  it('gives every comparison row a distinct icon', () => {
    // Both halves of a row share one icon — that is what says they are one
    // subject. Two rows sharing an icon would say the same of unrelated claims.
    const icons = comparison.rows.map(row => row.icon)
    expect(new Set(icons).size).toBe(icons.length)
  })

  it('names every comparison row in a word, and no two the same', () => {
    for (const row of comparison.rows) {
      const words = row.subject.trim().split(/\s+/)
      expect(words.length, `"${row.subject}" is a phrase, not a label`).toBeLessThanOrEqual(2)
      // The gutter is sized to the longest of these — see `SubjectTreatment.gutter`
      // — and a subject past it wraps, at which point it stops being a label and
      // starts being a third claim.
      expect(row.subject.length, `"${row.subject}" will wrap in the gutter`)
        .toBeLessThanOrEqual(12)
    }

    const subjects = comparison.rows.map(row => row.subject)
    expect(new Set(subjects).size, 'two rows are about the same thing').toBe(subjects.length)
  })

  it('keeps the subject out of the titles it labels', () => {
    // The gutter carries the subject once, which is what buys each half a title
    // that says only what it adds. A title restating the label — *Your product
    // model is scattered* under a mark reading `DEFINITION` — has spent the
    // row's most valuable string on a word the reader is already looking at,
    // and the gutter's 56px bought nothing.
    for (const row of comparison.rows) {
      for (const side of [row.before, row.after]) {
        expect(
          side.title.toLowerCase().includes(row.subject.toLowerCase()),
          `"${side.title}" repeats the "${row.subject}" mark beside it`
        ).toBe(false)
      }
    }
  })

  /**
   * Card rows equalise to the tallest card in their grid, so a note that wraps
   * further than its neighbours lifts every card around it — and the two
   * inventories stop being comparable at a glance.
   *
   * Character counts are a proxy for rendered lines, and a deliberately blunt
   * one: these are the lengths that wrap the same way at the width the cards are
   * read. `landing.desktop.spec.ts` measures the rendered heights for real.
   */
  it('keeps every inventory note to the same number of lines', () => {
    for (const section of homeContent.sections) {
      for (const item of section.items) {
        expect(item.note.length, `wraps further than its neighbours: "${item.note}"`)
          .toBeLessThanOrEqual(50)
      }
    }
  })

  it('gives every resource type three short examples', () => {
    // A description alone reads as a definition to memorise; three examples
    // show its range. The same count on every card keeps the cards one shape,
    // and each example fits on one line of a four-column card.
    for (const item of model.items) {
      const examples = item.examples ?? []
      expect(examples, `${item.title} needs three examples`).toHaveLength(3)
      for (const example of examples) {
        expect(example.length, `${item.title} example wraps: "${example}"`).toBeLessThanOrEqual(22)
      }
    }
  })

  it('keeps both halves of a comparison row to the same number of lines', () => {
    // Tighter than they used to be, because the gutter that names the row takes
    // 56px out of the pair: a line that fitted beside a bare glyph can wrap
    // beside a labelled one.
    for (const row of comparison.rows) {
      for (const side of [row.before, row.after]) {
        expect(side.title.length, `title wraps unevenly: "${side.title}"`)
          .toBeLessThanOrEqual(32)
        expect(side.description.length, `description wraps unevenly: "${side.description}"`)
          .toBeLessThanOrEqual(58)
      }
    }
  })

  it('names no tooling before the section that introduces it', () => {
    // The Product Model section defines the artifact and opens the page. Naming
    // the CLI, the directory or the validator there answers a question the
    // reader has not been asked yet — that is the comparison section's job.
    const prose = [
      model.title,
      model.description,
      model.verdict ?? '',
      ...model.items.flatMap(item => [item.title, item.note])
    ].join(' ').toLowerCase()

    for (const term of ['pdd-kit', 'pdd', 'product-driven', 'cli', 'verify']) {
      expect(prose, `the Product Model section names "${term}"`).not.toContain(term)
    }
  })

  /**
   * The wheel draws three phases and only three: the grid places each by id,
   * the heavy ticks are on thirds and the arrows sit between them. A fourth
   * entry would render into no cell at all, so the count is checked rather than
   * left to whoever adds one.
   *
   * These are the same three the PDD documentation runs on — the repository's
   * `docs/index.md` and ADR-0002 both name them — and resolution is
   * deliberately not among them. Nobody walks to it; verify does it, which is
   * why it lives in verify's note rather than in a station of its own.
   */
  it('runs the loop on the three phases the wheel is built for', () => {
    expect(loop.phases.map(phase => phase.id))
      .toEqual(['ideate', 'implement', 'verify'])
  })

  /**
   * The return has to name the station it returns to.
   *
   * Below `md` the ring is either gone or shrunk to a compass, and this line is
   * the only thing that keeps three phases from reading as a three-step list
   * ending at Verify. *Start over* would be a direction without a destination,
   * so the first phase's name is required to appear in it — and the length cap
   * is the one a 320px phone can hold on two lines beside a glyph.
   */
  it('closes the loop on the phase it opens with', () => {
    expect(loop.returnNote).toContain(loop.phases[0]!.name)
    expect(loop.returnNote.length, `wraps past two lines: "${loop.returnNote}"`)
      .toBeLessThanOrEqual(56)
  })

  /**
   * A phase note is read at roughly half the width an inventory card gives it —
   * the side of the wheel is what is left of the figure once the circle has
   * taken its share — and a phase that wraps further than its neighbours tilts a
   * ring it is supposed to sit level around. The cap holds every note to two
   * lines beside the ring at `lg`.
   */
  it('keeps every phase note to the same number of lines', () => {
    for (const phase of loop.phases) {
      expect(phase.note.length, `wraps further than its neighbours: "${phase.note}"`)
        .toBeLessThanOrEqual(64)
    }
  })

  /**
   * Ideate and verify are described in the reader's terms, not the model's
   * internals: *desired state* is state-model vocabulary, and *sync* is the
   * retired workflow's verb (`CONTEXT.md` lists it under _Avoid_ for verify).
   */
  it('keeps state and sync vocabulary out of the loop', () => {
    const copy = [loop.description, ...loop.phases.map(phase => phase.note)].join(' ').toLowerCase()

    expect(copy).not.toContain('desired state')
    expect(copy).not.toMatch(/\bsync/)
  })

  /**
   * The asymmetry is the argument, so it is checked rather than left to the
   * next person editing copy: ideate and verify are skills this product ships,
   * and implement is the reader's own workflow. A `yours` runner on ideate or
   * verify would give away a skill; a `skill` runner on implement would claim
   * an implementation tool pdd-kit does not have — there is no
   * `pdd-implement` — and the dashed chip that says so would quietly
   * become a solid one.
   *
   * The border is not the only signal. The section description says in words
   * that implementation happens in the reader's own workflow, and the chip
   * names that workflow rather than a tool, so the boundary survives without
   * colour, animation or hover.
   */
  it('names a skill for the two phases that have one, and not for implement', () => {
    const runners = Object.fromEntries(loop.phases.map(phase => [phase.id, phase.runner]))

    for (const id of ['ideate', 'verify']) {
      expect(runners[id]!.kind, `${id} does not name its skill`).toBe('skill')
      // Written the way it is invoked, and matching the skill names the PDD
      // documentation ships under `skill-pdd-*.md`.
      expect(runners[id]!.label).toBe(`/pdd-${id}`)
    }

    expect(runners.implement!.kind, 'implement claims a tool this product ships').toBe('yours')
    expect(runners.implement!.label).not.toContain('pdd-kit')

    const implement = loop.phases.find(phase => phase.id === 'implement')!
    expect(loop.description).toContain('Your own agent implements')
    expect(runners.implement!.label).toBe('your agent, your way')
    expect(implement.note.toLowerCase()).not.toContain('pdd-kit')
  })

  /**
   * The centre of the ring names what every phase turns on. Set in uppercase
   * mono, *pdd-kit / PDD* read PDD-KIT, PDD: a name repeating itself.
   */
  it('centres the wheel on the Product Model', () => {
    expect(loop.centerLabel).toBe('Product')
    expect(loop.centerMark).toBe('Model')
  })

  /**
   * A runner is set in a chip beside the ring, and a chip is a shape that only
   * works at one line — the wheel's cells are as wide as the circle leaves
   * them, and a name that wrapped would take the border round with it.
   */
  it('keeps every runner to one line', () => {
    for (const phase of loop.phases) {
      expect(phase.runner.label.length, `the chip wraps: "${phase.runner.label}"`)
        .toBeLessThanOrEqual(24)
    }
  })

  it('keeps section headings and descriptions concise', () => {
    // Character budgets keep the centred headings compact. Today's description
    // deliberately wraps to name information sources, systems, and people.
    const heads = [...homeContent.sections, comparison, loop]
    for (const head of heads) {
      expect(head.title.length, `title wraps: "${head.title}"`).toBeLessThanOrEqual(48)
      expect(head.description.length, `description too long: "${head.description}"`)
        .toBeLessThanOrEqual(head === today ? 120 : 96)
    }
  })
})

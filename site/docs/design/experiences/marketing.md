# Marketing, Writing, and Legal

read_when: changing positioning copy, the blog, the changelog, or the legal pages.

These are the surfaces that explain the product to someone who has not used it.
Like every page on the site, they are generated as static files.

Screens are in [marketing screens](../ui/marketing-screens.md),
[blog and changelog screens](../ui/writing-screens.md), and
[legal screens](../ui/legal-screens.md).

## What this site is selling

Nothing. There is no pricing page, no trial, no plan comparison, and no
signup call to action, because there is nothing to buy — monetization is paused and
`/pricing` was removed rather than shipping an offering with an empty cart.

Every path out of the marketing surface therefore leads to one of three places:
the catalog, the documentation, or GitHub. A marketing page that ends in a dead
end is a bug.

## The argument, in order

A hero and **six sections with one job each**, in an order that is itself the
argument:

1. **Hero** — open-source Product-Driven Development for coding agents, the
    problem that your agent is guessing, the Product Model that answers it, and
    the three ways in as buttons.
2. **The Product Model** — seven main resource collections, four to a row. Each card gives a
    one-line description and three bulleted examples from an ordinary shop; contained types such
    as Experiences, Screens and Scenarios are left to the documentation. What the artifact *is*,
    and nothing about how this product implements one.
3. **Where is your product model today?** — the eight places the pieces are actually
    scattered across.
4. **Clear product model. Focused sources.** — bring the product
    knowledge already in docs, designs, code, and people into one coherent
    definition, clarify uncertainty, fill gaps, and make each information source
    leaner, clearer, and more focused on its purpose.
    A volvelle illustration sits beside the five-row table of source purposes.
5. **What changes with a product model** — *One shared definition guides the
    work and stays current as the product changes.* Six practical
    questions follow one change from definition through what remains after it
    ships.
6. **The working loop** — ideate, implement, and verify as the three phases
    that repeat, each naming what runs it. Ideate and verify name their skills;
    implement names the reader's own agent, and the section description
    says in words that the reader's agent implements. The `/docs`
    wheel renders the same loop, and the PDD docs repeat its three notes.
7. **Get started** — the principle, and one link back to the doors.

**The artifact is defined before the reader is told they lack one.** That order
is load-bearing and is asserted in `tests/integration/homeContent.test.ts`.
"Where is your product model today?" only lands as a question if the reader already
knows what is being asked for; asked first, it reads as a sales question about a
thing they have not met.

**Section two names no tooling.** No `product-model/`, no CLI, no validation —
those answer a question the reader has not been asked yet, and they belong to
the comparison section, which introduces the implementation. A test greps the
section's prose for them, because the temptation to explain the tool while
defining the artifact is constant.

**Section three is a question, not a claim.** The honest answer is *you do not
have one*, and a reader reaches that faster themselves than they accept being
told it. The subhead does the telling — scattered, unshared, unchecked — which
is also why the section needs no closing verdict: it has already concluded in
its own heading.

**Section three shows the products, not just the categories.** Each scattered
place carries up to three brand marks of the tools it is actually kept in — Jira
and Linear on Tickets, Figma and Sketch on UX tools, Slack and Teams on Chat
threads. A reader recognises their own stack faster than they read a category
name, and the marks are what turn an abstract list into an inventory of tabs
they have open right now. The Product Model's resource types carry none: a resource type is
an idea, and no vendor ships one.

**The marks are in the colours their owners draw them in** — a Slack hash, a
Figma mark, Google Drive's triangle. That means the `logos` Iconify collection
rather than `simple-icons`, which is monochrome by design and cannot carry them,
and `mode="svg"` on the icon, because the CSS-mask mode paints an icon in
`currentColor` and would flatten every one of them back to sepia.

Take the `-icon` variant wherever one exists. The bare name is often the full
lockup — `logos:linear` is a four-to-one wordmark — and a wordmark set at the
cap height of a line of text is a smudge.

Rules that hold the row together, the first three asserted in
`tests/integration/homeContent.test.ts`:

- **No mark appears twice.** A product under two headings says the headings
  overlap, which is the opposite of what eight separate places are here to show.
- **Three marks at most.** They ride the title's line rather than a band of
  their own — a band would make Today's cards taller than the Product Model's,
  and `landing.desktop.spec.ts` holds a card to one height across both sections.
  A fourth mark pushes into the heading at the width four columns are read.
- **People takes the `users` glyph.** It is the only place no vendor sells, and
  the glyph is the one the comparison already spends on *knowledge leaves with
  the people*.
- **Every mark has to survive both grounds.** A new one gets checked on the
  cream page and the dark one. Two failure modes and two different answers:
  a mark drawn in a single near-black ink — GitHub's `#161614`, Linear's
  `#222326` — is turned over on the dark canvas by `HomeCard`'s `INK_MARKS`,
  which reproduces the white-on-dark lockup its owner publishes. A mark that is
  merely *low-contrast* gets replaced instead, because inverting a coloured mark
  makes it a different brand: Cypress's dark teal disc sank into the panel and
  Vitest took the slot.

**Every mark is a tooltip and a link out to the product**, opening in a new tab
— a reader checking what Coda is has not finished with this page. The tooltip is
the same `UTooltip` the docs search wears, so a name in the marketing body and a
name in the app chrome are the same object.

The name is spent twice: as the tooltip, and again as the link's `aria-label`.
A tooltip is `aria-describedby` and never names the thing it hangs off, so
without the label these would be twenty-one links a screen reader announces as
nothing at all.

They used to be decorative and `aria-hidden`, on the grounds that every mark
repeats the title beside it. That is still true, and it is no longer available:
a focusable element inside `aria-hidden` is a violation, so naming them and
hiding them cannot both be had. People's glyph is the exception and keeps the
old treatment — no vendor, no link, not focusable, still hidden.

**A section is a heading, a subhead, and its content.** Three kinds of label
were stripped from every section in one pass, each standing in for content
rather than carrying any:

- **Eyebrows.** Each restated its own heading a size smaller — *THE PRODUCT
  MODEL* over "One definition of what your product does" — and four of them down
  one page read as furniture. The hero keeps its eyebrow, which names the
  practice rather than the section. Section two has since turned that pair the
  other way up: **Product Model** is the heading and *One definition of what your
  product does* is the subhead. That is not the eyebrow returning — nothing is
  said twice, and the heading now carries the term the format, the documentation
  and the rest of the site all use. It is also the only head on the page whose
  subject is a thing rather than a claim, which is the correct asymmetry: the
  other three argue, this one defines.
- **Column headings** over the card grids. *WHAT A PRODUCT MODEL CONTAINS* named
  what eight labelled cards underneath it already showed. The cards moved up to
  `h3` so the outline does not skip a level.
- **Tinted grounds** on the two inventories. Colour means before-and-after on
  this page; washing a plain list green or red spent that meaning before the
  reader had been given any reason for it, and the comparison is where it earns
  its keep.

One consequence worth knowing: section four no longer names pdd-kit in
prose — its eyebrow was the only place it did. The header, footer and close all
name it, and the section names the *practice* and demonstrates it, which is the
order public copy runs in anyway.

**Every box of information says where it continues, in the same corner.** One
link per panel — the four that carry content — set in the page's mono label face,
dimmed, on the heading's own line at the top right of the box. It is deliberately
not a button: the page has one call to action and it is the hero's three doors.
The pattern replaced a filled *Read about the Product Model* under section two,
which was the only box with a route onward and therefore read as the one worth
continuing.

**The close carries none.** It is a sub-hero, not a box of information: one
headline, one sentence, one button back to the doors. A second route out of a
block that exists to make a single offer is the mistake the three competing
buttons made, in smaller type.

**Two labels, not five: *View in docs* and *Read blog*.** The label names the
kind of place, not the page — naming each page put a second title in the corner
of every box, and on the Product Model it repeated the heading a foot above it
word for word. The glyph follows the destination, an open book or a paper, so the
two kinds cannot be drawn with each other's mark.

**Today is the one box that leads to the blog.** It is the distilled form of
`your-agent-is-guessing`, and the post is where the same argument runs at length;
documentation would answer a question that section has not asked yet. The other
three continue in the docs — the Product Model page, the index, and the loop.

`more` is a required field on the box types that have one, so a new panel cannot
ship without saying where it goes; `tests/integration/homeContent.test.ts` holds
the destinations distinct and checks each label against the kind of place it
opens.

**The comparison follows one ordinary change.** It leads with where the product
definition lives, then what an agent receives and how its output is checked.
From there it shows when drift is found, where decisions travel, and what remains
after the request or proposal becomes history. These are practical questions a
team already asks, so the copy answers them directly rather than introducing a
second conceptual vocabulary inside the comparison.

**The columns say `Without a product model` and `With a product model`.** The old
`Before` and `After` labels made the reader infer what caused the change. The
explicit labels answer that once for all six rows.

**Neither inventory carries consequences.** Those are section four's, beside the
answers to them. A cost read next to its answer lands in one eye movement; the
same cost read two screens earlier is old news by the time the answer arrives,
and the comparison reads as repetition. The two inventories share
`SectionPanel`, which is what makes them read as two answers to one question
rather than as a problem and a pitch.

**The problem is not an AI problem.** The root is that the product and business
definition has no home and drifts from the code; agents are one of its two
victims rather than the reason it matters. Today establishes the definition gap
before With a product model sells the fix.

**The close came back, and the reason it can is the comparison.** "A repository
should be able to explain the product it implements" was cut when this page was
two sections long, because a headline restating the thesis to a reader who had
*just finished the argument* is a second hero. That objection was right then and
does not hold now: the page ends on a payoff rather than a thesis, so a
principle arriving after it reads as a conclusion drawn rather than a claim
repeated. It is the strongest line the project has — it names no problem and no audience, which is exactly why
it works at the foot and not at the top.

**It carries one link, back to `#start`.** Two heavier versions were tried and
both put the whole offer on the page twice: a row of three buttons that competed
with the hero's doors, and then the hero's own CTA block rendered again in full.
The three ways in exist once, at the top; the close says *the way in is where
you came in* and costs one anchor. `#start` lives on the hero section in
`MapHero.vue`, so this is a real link rather than a scroll handler — it works
without JavaScript and moves focus.

Three more things are deliberately absent, and each is absent for the same
reason — the page was long enough to stop earning its length:

- **The three ways in are hero buttons, not a section.** They are a choice, and a
  choice is a button. Each is an engraved plate over a full brass button in the
  same solid as the header's Get started — three equal doors, none emphasised,
  because the emphasised one was always the one the reader was not in. Two of the
  three still leave the site, per
  [ADR-0008](../../adr/0008-two-home-page-doors-leave-the-site.md).

  **The shared install command leads the plates.** It installs the agent skills
  every path uses, stays visible in all three CTA treatments, and keeps its copy
  control. Choosing a way answers what to do after installation; it does not
  replace installation.

  **The hero carries no Get started of its own.** One sat above the plates
  briefly. The header already carries that route on every page, and a second
  beside the doors asks the reader to choose between a door and the corridor all
  three open onto. `landing.desktop.spec.ts` asserts `#start` has none.

  A pressed plate opens its steps in a centred dialog. Linking straight out and
  a slideover from the right competed for that from a Hero CTA row in the
  preview bar; the modal won and the row went with the losers.

  Width is what forced the question. From `xl` the copy is pinned to `max-w-xl`
  so the headline stays inside the scrim, and three equal buttons do not fit
  576px: they wrapped 2 + 1 with the emphasised one stranded in the middle.
  `tests/e2e/landing.desktop.spec.ts` exercises the plates at 390, 768, 1280 and
  1920 and fails on horizontal overflow.
- **PDD beside SDD is gone from this page.** It is an objection, and objections
  belong where they are asked: it is the first question under "About the project"
  in `/faq`, with the depth on the `/docs` Introduction, whose loop names plan mode
  and SDD frameworks as ways to implement. A page this size cannot
  afford to spend a section arguing about a neighbouring category. That left
  the shared `secondary: terracotta` alias homeless, until the arrangements
  below gave it the job of marking the section that describes the problem.
- **The open-source section folded into the close, and left with it.** Its
  instruction box was the only part not said elsewhere once "Map an existing
  repo" moved into the hero — repository-owned and explicitly verified are exactly
  what the gains claim. MIT and the source are still in the footer and the FAQ.

The long form of sections 2 and 3 is
[the thesis post](../../../content/blog/your-agent-is-guessing.md), whose title is
this page's h1, and the two must agree. See
[ADR-0007](../../adr/0007-pdd-names-the-practice.md) and
[ADR-0009](../../adr/0009-the-home-page-teaches-all-eight-entities.md).

## Arrangements

The FAQ ships in one arrangement, `app/components/landing/faq/FaqLayout.vue` —
the panelled shape, every section a bordered card on an elevated ground. Five
competed for that slot from a Layout row in the preview bar; the comparison is
finished, the four that lost are deleted rather than left reachable behind a
cookie nobody flips, and the Layout row went with them. The blog had already
settled the same way, on [WRT-02](../ui/writing-screens.md#wrt-02--blog-post).

**The home page took seven rounds.** Every round rendered `homeContent` and
deleted its losers before the next began, which is why the record below reads as
a sequence of settled questions rather than a menu. None is open.

### Round one settled three things

Five very different shapes competed — two balanced columns, a pinned column,
facing panels, full-bleed bands, and a counted slab. The seam won, the centred
heading from the bands won with it, and everything else was deleted. What the
round produced was mostly a list of faults, and round two exists to fix them:

1. **The halves did not cover the same ground.** Two costs opposite six state
    cards left the right side half empty; eight resource types opposite six gains left
    the left side short. Measured as slack — the gap below a column's last card
    — the seam left 716px in the second section.
2. **A section took too much scrolling.** The second section ran 1606px.
3. **Nothing said which section was the bad one.**

### Round two: the seam, made comparable

The third fault was fixed in content rather than in layout. `HomeSection.tone`
is `negative` or `positive`, because which of the two states is the bad one is a
fact about the argument — an arrangement may choose how loudly to say it, never
whether it is true. Five signal treatments competed; the gradient won, and the
rest were deleted.

The round's two durable findings:

- **Column width is the only real lever on section height.** Prose height is
  total text over column width, so regridding six gains into two narrow files
  saves their padding and nothing else.
- **Terracotta needs roughly half again the alpha green does.** It is a near
  neighbour of the parchment ground; matched percentages give a section that
  shouts on one side and whispers on the other. Recorded in
  [brand guidelines](../foundation/brand-guidelines.md#color).

### The two states are mirrors

Six costs against six gains, **in the same order, each pair sharing a subject and
an icon**, each stating the same fact twice — once as a loss and once as a gain.
The subject is named once, in the gutter between them, which is why neither half
repeats it — see [round seven](#round-seven-settled-the-gutter-it-names-the-row).

| | | Without a product model | With a product model |
| --- | --- | --- | --- |
| `boxes` | Definition | Spread across many places | Written in one product model |
| `bot` | Agents | Work out what you meant | Know what to build |
| `circle-check-big` | Done | The code is finished | The code matches the product |
| `siren` | Drift | Found when someone notices | Differences are easier to find |
| `git-pull-request` | Decisions | Often live outside the code | Travel with the code |
| `history` | After ship | The request becomes history | The model stays current |

This is what the flip requires. The panel turns over to show the other side of
*itself*, so a reader lands on the same card in the same place and the only
thing that changed is which way round the claim runs. A card with no opposite is
a card they cannot place.

Adding a cost means adding the gain that answers it — a `ComparisonRow` holds
both halves, so that one cannot fall out of step.

**The two inventories are counted independently.** They diverged when Entity
joined as a ninth resource type, then returned to eight when Actor became an
Entity facet. That history does not make their counts depend on each other:
each inventory remains whatever its subject defines. What survives is the card,
one treatment at one height in both sections, so they read as two answers to the
same question. Both currently run four across, and
`tests/integration/homeContent.test.ts` checks each section fills its own rows
rather than checking the two against each other.

**No count in the headline.** It read *Your product is defined in six places*,
which meant re-cutting the sentence every time the list grew — it is eight now —
and it ran to two lines at the width a centred heading is read. *Your product
definition is scattered* is the claim; the list below is the evidence. Titles
in the inventories, comparison, and loop are capped at 48 characters and their
subheads at 96, enforced by the same test. Today's subhead allows 120 characters
and wraps deliberately to name information sources, systems, and people.

### The card is one object

Both states render one `SectionBody` of one `HomeCard`, at one height, with one
line of note. This is the settled part and the constraint everything else works
within:

- **One line per note.** Enforced on `OutcomeItem` in `homeContent.ts` and
  checked in `tests/integration/homeContent.test.ts`, not left to layout.
  Descriptions used to run to three clauses on one side and five words on the
  other, which produced two differently-shaped sections making the same shape of
  claim — the reader had to work out that they were comparable.
- **One height.** `min-h` on the card plus `auto-rows-fr` on the grid. Nothing
  stretches to fill any more: the previous round grew Today's two costs to cover
  six state cards, which made one section's cards visibly unlike the other's.
- **An even split.** It was 40/60 in the outcomes' favour while their prose was
  long. Once both sides were one line the narrow column became the one that
  wrapped, and starving it made the state cards half again as tall as the
  outcomes opposite them.

Shortening the outcome copy is what made the rest possible, and it is also what
makes the before/after arrangements below work at all: two layers of different
height cannot share one frame.

### Round three: the comparison earns its own section

Five before/after models competed against a stacked reference — a segmented
switch, a draggable wipe, a deck, a two-stop rail, and a flip. The flip won on
the strength of its claim (*the same object seen from the other side*) and then
lost to a plainer objection: **the comparison is important enough to be a
section, not a control.** Every one of those models hid half the argument behind
an interaction, and a landing page cannot assume the interaction happens.

So the page became three sections, and the comparison is the third. It shows
both states at once — which is what round three's reference arrangement had been
saying all along, and what makes a control unnecessary rather than merely
optional.

**What was gained from the flip and kept:** six problems against six answers, in
the same order, each pair sharing an icon. That pairing is now structural — a
`ComparisonRow` holds both halves, so a cost that loses its answer is
unrepresentable rather than something a test has to catch.

**What was lost:** the flip made *same object, other side* a felt claim. A
static section states it. `Reveal` is the one treatment that tries to recover
that, by having each answer arrive beside its problem on scroll — without ever
hiding it.

### Round four settled the shape of a pair

Five treatments competed — a ledger of rows, six self-contained cards, two tall
columns, a diff, and a scroll reveal. **The ledger won**: a pair the reader
associates across a gutter is the only form that stays scannable as two columns
while still reading as one row. The icon belongs to neither half, which is what
says the two cards beside it are one subject.

### Round five settled the signal: depth

Two attempts with colour failed the same way. The first filled both halves —
terracotta left, green right — which was more paint than a page of parchment and
rules can carry, and put the signal *behind* the claim rather than on it. The
second kept those hues as edges, glyphs and struck lines: cleaner, and still
wrong, because **red and green are not in this palette**. `secondary` is a rust
and `success` a cool green, and this page reads that pair as borrowed from a
form validation state. Lightness of touch does not fix a hue that does not
belong.

Five palette-native signals then competed — two weights of ink, a brass accent
on one side, engraver's hatching, a brass seal, and elevation. **Depth won**, and
a further round of five depths (a softer raise, an inset sink, a stacked sheet, a
hard cast shadow, an embossed plate) failed to beat the original. It ships as it
was first drawn:

> the answer carries `shadow-lg` tinted with `--ui-border-accented`; the problem
> lies flat behind a fainter border.

Tinting the shadow with the border token rather than a black is the part worth
keeping. The parchment grounds contain no black, so a default shadow reads as
grime on them; `--ui-border-accented` is the page's own darkest line, and it
holds in dark mode where a shadow cannot be built from black at all.

Depth uses no hue, survives a greyscale print, and says the thing the section
means without any learned convention: the half the page argues for sits above
the half it argues against. The column headings say `Before` and `After` in
neutral ink, so nothing depends on the depth being perceived.

`tests/e2e/landing.desktop.spec.ts` drives the page at 390, 768, 1280 and 1920,
fails on horizontal overflow, runs an axe scan at `lg` in **both colour modes**,
and asserts both halves of every row straight out of `homeContent`.

**The copy is written once, apart from the arrangement.** Home copy lives in
`app/utils/homeContent.ts` and FAQ copy in `itai-gendler/pdd-kit:docs/faq.md`. That
separation was what made every one of these comparisons honest — no arrangement
could win by quietly rewording — and it outlives them: the words stay reviewable
on their own, without reading a template.

**The FAQ collapses its answers.** That was the one thing the five arrangements
genuinely disagreed about, and it is the decision the surviving one carries: the
page is a list of situations to scan for your own, not a document to read
through.

### Round six settled the resource type plates

The resource types are the one inventory on the page with nothing to show. Today's
cards carry the brand marks of the products each place is actually kept in — a
reader recognises those — and no vendor ships an Actor, so the Product Model's
cards answered with nothing at all. They now have engraved plates of their own,
in `public/brand/icons/resource-types/`.

**The shape is settled: a full-width band across the top of the card.** It beat
a 28px mark on the title line, a 56px tile, a 64px aside and a full square. The
smaller placements all failed the same way — this is fine copperplate line work,
and below roughly 40px the hatching collapses into a smudge, so they bought
height parity with Today by giving up the reason to have artwork at all.

**The original plates were nine views of one kingdom.** That is the decision the first
three sets were missing, and the reason they failed.

Those sets picked a metaphor per resource type, one at a time, and each was defensible
alone: a top-hatted gentleman for Actors, a ring of keys for Interfaces, a garden
wall for Experiences, a mirror for Screens, a chest of drawers for Domains. Two
faults, both fatal at this size:

- **They illustrated the words, not the ideas.** Actors reads *"a goal or a
  privilege, **not a job title**"* — and we drew a job title. Screens reads *"a
  meaningful view, **not a route or a component**"* — and we drew a mirror, which
  is a pun on *view*. The copy and the artwork were arguing with each other.
  (Screens now reads *"not a route or module"*: at three columns the longer line
  wrapped where every other note fit on one, and only that card's row grew.)
- **Nine unrelated objects have no system.** A gentleman, keys, a wall, a mirror
  and a cabinet are a curiosity shelf. The hero can carry three objects because
  each is a thing you *do*; nine categories cannot.

A kingdom fixes both, because it has **the model's own shape**: nested
containment, a small number of named and differently-purposed ways in, machinery
that does work, and a charter that holds over all of it. Every plate is a part of
one place, so the set argues for the structure instead of decorating it.

| Resource type | Plate |
| --- | --- |
| Entities | The steward's tally: a storehouse counted into a ledger, a boy leading in a sheep, a labourer bringing a sack |
| Interfaces | A curtain wall pierced by three different ways in |
| Experiences | The courtyard from inside, its quarters behind those gates |
| Screens | One stone chamber, its window the focus |
| Domains | The realm's provinces on a map |
| Capabilities | The forge — anvil, hearth, hammer |
| Journeys | A road winding away between hedgerows |
| Scenarios | The same road, forking |
| Business rules | A great book lying open |
| Variations | Three timber arch templates of one span on a mason's peg rail: round, pointed and ogee |

**Interfaces and Experiences are one shot, reversed.** Interfaces is the wall from
*outside*, and it must show more than one opening — a single gatehouse reads as
*the* way in, which is the opposite of what the copy says. It carries a main
gateway with the drawbridge down, a low postern, and a water gate. Experiences is
the same wall from *inside*: those three gates seen from behind, and the ground
divided into a quarter leading in from each. The pair does the argument that no
single plate could — several supported ways in, each opening onto a coherent
context with its own limits.

Three rules held the set together and are worth keeping:

- **Scale is not a difference at 169px.** Provinces, a town and a room are all
  "a subdivision of a place", and shrinking them to a card destroys the only
  thing telling them apart. They are drawn in three different *genres* instead —
  a map, an elevation, an interior.
- **One of a thing, not four.** Four figures or four workshops in a band is a
  smudge. Actors was the one plural plate and carried three, chosen to read as
  different *standing* rather than different trades. Entities is a scene rather
  than a lineup: a steward taking the tally of a storehouse — barrels, sacks and
  a chest counted into his ledger — while a boy leads in a sheep and a labourer
  carries in a sack. Property, livestock, a child and the people who act are
  one count, which is the argument ADR-0015 needed a picture for: an Entity is
  an order as much as a shopper.

  Two answers lost to it. The first extended the Actors figures with a ledger
  and a strongbox standing in the row at their scale, and shipped briefly; a
  lineup of people and things says *five things* more than it says *the kinds
  of thing the kingdom counts*. The second was a procession of the same things
  behind a herald with the roll, in four takes from an Entities row in the
  preview bar. The frieze reads as a story walking past, where the tally reads
  as the act of keeping, and the row went with the losers.
- **Gates open, drawbridge down.** A castle can read as a fortress keeping people
  out, which is the wrong argument for a page selling a shared definition.

They are drawn to fill the sheet, in the hero's own prompt formula: bold
silhouette, thick confident outlines, generous margin, nothing else on the paper.
The subject stands **54%–93% of the plate's height**, against 48% in the set
before.

**The band is 16:9 and there is no switcher.** Three comparisons ran on the
preview bar to get here — where the plate sits, how tall the band is, and how
large the drawing sits inside it — and all three are settled, so the row and its
cookies are gone. The plates are drawn on 16:9 sheets and the card cuts a 16:9
band, so `object-cover` crops nothing at all.

The two retired axes are worth recording, because both were closed by the
artwork rather than by taste:

- **Size.** A control briefly scaled the plate up inside a clipped band, and
  existed only because the drawings were too small to carry the card. Once they
  were redrawn large the room went with the need: at 16:9 the tallest leaves
  1.11× of headroom. Scaling *down* was never available — the plate is its own
  background, so shrinking it exposes the dark card behind. **If a plate needs
  to sit larger or smaller, redraw that plate.** Do not reach for a zoom.
- **Height.** A 2:1 band ran beside 16:9 for a round. Experiences is drawn to
  the very edge of its sheet, so 2:1 cut 11% off the top and bottom, taking the
  battlements at both ends.

**Measure before choosing a different ratio.** `object-cover` keeps the middle
`16/9 ÷ ratio` of a plate's height. The tallest drawing is Experiences at 99.9%
— the castle wall runs to both edges — with Domains behind it at 92.8%, because
a map fills its sheet where an object merely sits in one. Load a plate to a
canvas, find the rows darker than the paper by 45, and take
`max(1 - 2·top, 2·bottom - 1)`; anything shorter than that fraction clips. The
failure is quiet — a battlement goes missing and the page still renders.

**Every resource type card is a link into its documentation**, stretched over the whole
box from the title rather than added as a trailing arrow: the card already shows
the thing and names it, so the box itself is the invitation. That is also why
`HomeCard` keeps `<article>` as its root and reaches the card with an `after`
overlay — the grid and `landing.desktop.spec.ts` both address the article, and a
link wrapped round everything would read the entire card aloud as its own name.

The two card shapes are **mutually exclusive, and the markup depends on it**: a
Today card carries up to three brand-mark links, a resource type card is one link over
its face, and a card with both would nest a link inside a link.
`homeContent.test.ts` asserts that in both directions rather than leaving it to
the axe scan to find once someone renders it.

**This round breaks *the card is one object*.** The band makes a Product Model
card taller than a Today card, and that is the trade the round exists to make.
`landing.desktop.spec.ts` was narrowed to match: each section is still held to
one card height, because a ragged height inside a section still means a note
that wraps further than its neighbours, but the two sections are no longer held
to each other. Dropping the plates would restore the equality.

**Parchment stays parchment in dark mode**, exactly as the hero's plates do.
Inverting an engraving makes ink of the paper and paper of the ink.

### The hero map's lettering

Its captions are the contracts' own sentences, not copy: Entities from
ADR-0015, Experiences and Capabilities from `spec/format.md`, Business Rules
from ADR-0017. A redraw that lets the model write them invents its own
definitions, which is how the map spent a release defining an Entity as an
Actor.

**The mobile hero is `crop 680x1019+860+0` of the wide.** Measured, not assumed:
that offset scores an RMSE of 0.010 against the shipped file where its
neighbours twenty pixels either side score 0.17. Crop it. Generating it
separately returns a different zoom and its own spelling.

**A redraw resets every label, so read every label.** One pass fixed the caption
it was asked to fix and quietly turned `EXPERIENCES` into `EXPERIENEES` and
`Store Admin` into `Sions Admin`. To change a single block, patch instead: cut
the corrected block out of the edit, tone-match it, and blend it over the blank
parchment either side, with the feather clear of the type.

### Round seven settled the gutter: it names the row

The gutter carried the one thing that says the two cards beside it are *one
subject rather than two*, and it said it with a glyph. Six rows in, a reader who
has not decoded `i-lucide-siren` has no index into the section at all — they can
read any single row and cannot scan the set.

**The subject is now named in a word, under the glyph, in a gutter widened from
`w-14` to `w-28`.** The six read down the middle as a taxonomy:

> Definition · Agents · Done · Drift · Decisions · After ship

Four other places for the word lost. *Inline* set it beside the glyph at `w-40`,
*plate* dropped the glyph and stamped the word alone in a pill, and *header* gave
each pair a titled band with a rule and no gutter at all. Header was the closest —
it is the only one that costs no card width, and the subject genuinely precedes
what it labels — but it turns six rows into six mini-sections and gives up the
table, which is the form this section won on two rounds ago. The stack names the
row without stopping being a table.

**The titles are predicates now, not sentences.** The word in the gutter is paid
for out of the cards, so the cards stop paying for the noun twice: *Your product
model is scattered* against *Your product model is centralized* became
*Spread across many places* against *Written in one Product Model*.
`homeContent.test.ts` holds every title free of the mark beside it, and the line
caps came down with the width — 32 characters for a title, 58 for its line.

Three things the losing treatments taught, which a successor inherits:

- **The glyph column is load-bearing.** Centring a glyph-plus-word pair lets a
  long subject shove its own glyph sideways, and the one alignment the section
  has always had comes out ragged. That is what killed `inline`.
- **A mark that becomes a heading needs the rows pulled apart.** Once the halves
  stack, the mark titles the pair below it — and with equal air above and below
  it titles neither. The row gap is `gap-7` below `lg` and `gap-2.5` above it,
  where the gutter still reads as a table column.
- **The subject is not a heading element.** Six subjects at `h4` would push every
  card title to `h5` for an index rather than a claim. The mark indexes the row;
  the cards carry what it says. It is first in the DOM and the wide grid places
  all three children explicitly, so a linear read hears *Definition, spread
  across many places, written in one Product Model*. The glyph is `aria-hidden` — the
  word beside it says the same thing in words.

Copy is governed by the
[brand guidelines](../foundation/brand-guidelines.md) and the vocabulary in
[`CONTEXT.md`](../../../CONTEXT.md). Rewriting a headline without them produces
a page that argues for something slightly different from the rest of the site.

## Navigation

The header carries four items and one action:

> Blueprints · Docs · Blog · FAQ — and **Get started**

The four links stay centered in their own desktop column. Documentation search
and Vocabulary are always available in the right utility group across the site.
The [shared header](../ui/marketing-screens.md#shared-header) documents responsive
placement and how site and report lookups coexist.

Each removal has a reason. **Home** duplicated the logo, which already links to
`/`. **Changelog** was in the header *and* the footer; the footer keeps it, so
nothing was lost. **FAQ** moves up from footer-only because it is one of the three
surfaces that carry the concept, and it was the hardest of the three to reach.

Beside the logo sits the PDD release badge — `v0.6.0`, in the mono face the rest
of the site reserves for ids and digests. It is read at build time from the
root `package.json` of the repository the site is built in and published as
`runtimeConfig.public.pddVersion`, so the badge moves with the release and no
second number is kept by hand. It is a label, not a menu:
the format has one current release, and a dropdown of old ones would invite
visitors to read documentation that no longer describes the tool. Unlike the
wordmark it survives every breakpoint, because the version a visitor is reading
about is part of the identity, not header chrome.

The action changed from "Browse Blueprints" to **Get started** → `/docs`
because a persistent call to action has to serve all three doors, and only one of
them ends on this site. "Browse Blueprints" stays wherever the catalog is the
subject. The nav stays flat, per [UI patterns](../ui/README.md).

There is no account menu and no way to log in: the site has no accounts.

## The FAQ answers situations, not vocabulary

Definitions belong on the home page and in the documentation; repeating them in
`/faq` produces a third copy that drifts from the other two. The FAQ instead answers where a visitor actually is, in five
groups — one flat list is a wall, and the doors stop reading as a set. The
order follows an adopter's objections: why at all, then what changes for the
team, then how it compares, then how to begin.

**Why a Product Model** — existing documentation, AGENTS.md, and why a
structured format rather than free-form documentation.

**Adopting it** — another tool in the stack, the development lifecycle, keeping
the model current in a PR, reviewing a model change, and sharing the report.

**What it is and isn't** — every comparison in one place: SDD, AI-generated
docs such as DeepWiki, PRDs, user stories, ERDs, design specs, and UI/UX design.

**Getting started** — one question per door, phrased as the visitor's position:
already have a codebase; have an idea and nothing built; want to start from
something proven; what actually lands in the repository; when to map or verify;
then the project scope supported today — open or closed source, and a product
spanning multiple repositories. The last is an explicit current boundary:
pdd-kit works with one repository at a time, with multi-repository support
planned for a future version.

**Trust and help** — cost, what leaves your machine, contributing a Blueprint,
and where to get help.

**Existing documentation gets its own question.** "We already have documentation.
Why do we need a Product Model?" is answered like the PRD and ERD questions, with
a comparison table, and justifies both sides rather than dismissing either.
Documentation earns its place by being selective for people using the product,
which is also why it is the wrong home for every rule; the model earns its place by being complete: it draws the line between product
and implementation, holding what any rebuild would have to keep and nothing a
rebuild is free to change. Its lead and "Contains" row use the five-part line, so
the FAQ does not understate the model as only "what the product does". The answer then states PDD's position on how the two relate: they are not
competing copies. The model defines the product itself, in the canonical
five-part line from "Introducing pdd-kit": who it serves, where they reach
it, what it keeps, what it can do, and which rules must stay true. The documentation never owns any of that, and
presents the part a user needs plus usage material that is not product
definition (installation, setup, examples, troubleshooting). The answer avoids
"behavior" as the summary of the model, because it reads as excluding
Interfaces, Screens and Entities. A behavior change lands in the model
first, the code follows and is verified, and the documentation presenting that
behavior is updated to match. References are optional: a page attached to a
resource is easy to find when it changes, but not every page is attached. The answer ends by conceding that documentation which already states
the complete, current definition needs no second copy. It links to
`/blog/your-agent-is-guessing` and `/docs/references`.

**Design gets two questions.** "Is the Product Model a design spec?" keeps its
prose answer. "Does the Product Model replace my UI/UX design?" is answered
with two lists, *In the model* beside *Left to design*, five items each — the
same five pairs the PDD README and docs Introduction print, so the three cannot
drift. The design side names a CLI's syntax and an API's style beside the
visual ones, because the model is not only about screens. The lists sat on the
home page for one round and moved here: the home page defines the artifact, and
this is an objection, which belongs where it is asked.

Phrase questions the way the reader would, keep the jargon out of the question
itself, and put the mechanism after the answer — the same rule the legal pages
follow, for the same reason.

## Blog and changelog are sourced differently

The blog is Nuxt Content in this repository, under `content/blog/`. Its schema
requires `date` and `image` precisely so a post cannot ship without a card that
renders.

**Each post is written for one channel**, which is what keeps the blog from
becoming a swamp of near-duplicates. LinkedIn is served natively by the home page
and links to no post at all, so no post has to survive a cold feed. See
[ADR-0010](../../adr/0010-one-blog-post-per-channel.md).

| Post | Written for |
| --- | --- |
| `your-agent-is-guessing` | The blog's own front door; external newsletters and dev.to |
| `introducing-pdd-kit` | Nowhere — the canonical explainer linked from the README, docs and comments |
| `pdd-and-spec-driven-development` | Reddit and Hacker News, where the audience already argues about spec-kit and Kiro |

**All three name PDD up front** rather than arriving at it in paragraph nine.
Three earlier posts each restated the other two — the same OpenAPI/Terraform
opening, the same six gains — and were merged into `your-agent-is-guessing`, with
`product-driven-design`, `product-driven-development` and
`the-missing-standard-for-product-knowledge` removed. Those paths are not
generated, under
[ADR-0017](../../adr/0017-current-contract-only-before-launch.md).
The PDD reference material those posts carried is documentation,
not a dated post: it lives at `/docs` (the development loop) and
`/docs/references`.

**Documentation links from any marketing surface must resolve in the same
checkout.** The docs collection is read from the repository's `docs/` at build
time, and generation fails on a broken internal link, so a link to a page that
does not exist yet cannot ship. Public definitions live
on their owning Product Model pages rather than a standalone glossary.

The blog argues; it does not define. Anything a visitor must understand to use
the product belongs on the home page or in the documentation, where it is not
dated and not buried in an essay.

**The changelog is `itai-gendler/pdd-kit`'s `CHANGELOG.md`, rendered as-is.** It is
read from the same checkout as the docs, and nothing here rewrites,
summarizes, reorders, or keeps a copy of an entry. Each `##` release is one card
in the timeline, with its entries rendered as written; the hero, section marks
and the Versions anchor menu are the page's own chrome. A
second hand-kept list drifted from the file it restated. The pull request and
commit after each entry, the contributors and the Full Changelog line are in
the file itself, written by the root `changelog:release` script when a release is rolled. A
changelog edit reaches the site in the same pull request, and
`tests/e2e/changelog.spec.ts` compares the rendered headings with the
checked-out file, so a stale or missing copy fails CI rather than shipping.

**Changelog entries are not rewritten when the vocabulary moves on.** Historical
entries describe what each release actually shipped, including concepts that were
later retired. They are a record of what happened, not a claim about what exists
now. The site keeps no copy of the file, so it holds no retired vocabulary in
prose for it.

## Legal pages answer questions, not lawyers

`/privacy` is the only one left, and it is written to be readable by the person
who has the question. Lead with the concrete scenario, keep the jargon out of the
question itself, and put the mechanism after the answer.

The security page and the terms were retired with the footer refresh — the
reasoning, and the conditions under which terms should come back, are in
[legal screens](../ui/legal-screens.md). Vulnerability reports go to the
`SECURITY.md` policy in `itai-gendler/pdd-kit`, which `/faq` links.

What they can truthfully say is a consequence of the architecture rather than a
promise layered on top: the site is static and has no accounts, and the catalog
is anonymous to read and to pull, so no visitor is ever identified. See
[analytics](../../analytics.md) for what the consent-gated analytics records.

### FAQ content ownership

The FAQ is authored once in the repository's `docs/faq.md`, readable directly
on GitHub. The site reads it through a dedicated Nuxt Content collection from
the same checkout as docs and changelog, and it hot-reloads under `pnpm dev`.
It is excluded from the regular docs collection: no docs sidebar, search,
previous/next entry, `/docs/faq` page, or duplicate sitemap URL.
`shared/faq-content.ts` validates the parsed Markdown and adapts its groups,
answers, tables, commands and closing links for the existing accordion layout.
The FAQ data loader projects the Markdown once into its page payload and loads
the adapter only when fetching content; hydration reuses the prepared answers.
Named anchors preserve group addresses; plain Markdown carries the meaning.
Malformed content fails validation rather than silently losing answer blocks.
The repository's guidance records the supported authoring shapes.

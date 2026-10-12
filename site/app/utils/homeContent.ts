/**
 * Every word on the home page, in one place.
 *
 * The five arrangements in `components/landing/home/` all render this object, so
 * they cannot drift into saying different things — which is the whole basis of
 * the comparison they exist to support. Change the copy here and all five change
 * together.
 *
 * The page is deliberately short: a hero, then two sections that mirror each
 * other. **Today** — where the product is defined now, and what that costs.
 * **With a Product Model** — what the artifact contains, and what follows from
 * having it. Both read left to right, state then result, which is the one shape
 * the whole body commits to.
 *
 * The three ways in are hero buttons rather than a section, and the PDD/SDD
 * comparison lives in `/faq`, `content/blog/pdd-and-spec-driven-development.md`
 * rather than here — a page this size cannot afford to
 * argue against a neighbouring category. See
 * `docs/design/experiences/marketing.md`.
 *
 * The two sections are the distilled form of
 * `content/blog/your-agent-is-guessing.md`, whose title is this hero's h1. The
 * two must agree: the post is where the argument is made at length, this is
 * where it is made quickly.
 *
 * **Documentation links must exist on `itai-gendler/pdd-kit`'s `main` branch.** The
 * docs collection resolves there in production, so linking a page that only
 * exists on the release branch ships a 404. Public Product Model definitions
 * live on their owning resource type pages; there is no standalone terminology page.
 */

export interface HomeLink {
  label: string
  to: string
}

export interface HeroAction {
  id: string
  label: string
  /**
   * The label phones show. A third of a 390px screen cannot hold the full label
   * on one line, and a two-line button reads as broken. It must stay contained
   * in `label`, which remains the accessible name at every width, so what a
   * speech-input user sees is still part of what they can say.
   */
  shortLabel: string
  to: string
  /**
   * The one way in drawn as the solid button; the others are outlined. Mapping
   * the reader's own repository is the shortest route to seeing a Product Model
   * of their product rather than of ours, so it is the one the hero leads with.
   */
  primary?: boolean
  /**
   * The label for the link that ends the steps. It names the destination rather
   * than repeating the way's own name, because by then the visitor has read the
   * path and only needs to know where the button goes.
   */
  moreLabel: string
  /**
   * The large plate: a full copperplate engraving that keeps its cream ground
   * rather than being masked, because its interior hatching is the point and a
   * mask would flatten it to a silhouette. Carrying its own paper is also what
   * lets one file sit on both the light and the dark canvas.
   */
  plate: string
  /**
   * What actually happens if you take this way in. Shown by the arrangements
   * that reveal steps when a plate is pressed, so the visitor can see the whole
   * path before committing to it.
   */
  steps: WayStep[]
}

export interface WayStep {
  /** Rendered as a mono command line when present. */
  command?: string
  /**
   * What the reader says to their coding agent, rendered as a chat line rather
   * than a command. Everyday steps are asks, because the agent picks the skill
   * from what the reader says; a sentence set as a shell line would tell the
   * reader to type it at a prompt. A one-off, concrete start (mapping a repo,
   * ideating a new product) names its skill as a `command` instead.
   */
  ask?: string
  /**
   * The Blueprint a pull step starts on. The step renders a picker over the
   * live catalog and builds the pull command from the chosen slug, so the
   * reader copies the command for the Blueprint they want, not for ours. This
   * slug is only the default and the fallback when the catalog cannot load.
   */
  blueprint?: string
  /** What that step does, in one line. */
  text: string
}

/**
 * One product a scattered place is actually kept in, drawn as its own mark.
 *
 * **From the `logos` Iconify collection, not `simple-icons`.** These are the
 * marks in the colours their owners draw them in, and Simple Icons is
 * monochrome by design — one path, no colour — so it cannot carry a Slack hash
 * or a Figma mark at all. Take the `-icon` variant wherever one exists: the
 * bare name is often the full lockup, and a wordmark set at the cap height of a
 * line of text is a smudge.
 */
export interface BrandMark {
  icon: string
  /**
   * The product, as its owner writes it.
   *
   * Shown in the tooltip and spent again as the link's accessible name, because
   * a tooltip is `aria-describedby` and never names the thing it hangs off.
   */
  name: string
  /**
   * Where the product lives. Opens in a new tab: a reader clicking Figma is
   * checking a name, not leaving, and this page is the thing they came for.
   *
   * Absent on the one mark that is not a product — People's glyph has no vendor
   * to link to — which is also what makes it the one mark that stays
   * decorative and out of the tab order.
   */
  to?: string
}

/**
 * One entry in an inventory: a place the definition is scattered to today, or
 * a resource type a Product Model is made of. Neither count is fixed — both lists
 * have been recut, so nothing outside the section should assume a length.
 */
export interface StateItem {
  title: string
  /**
   * Three things of this resource type from an ordinary shop, so the
   * description beside them is read against something concrete. One example
   * reads as the definition; three show the range, and the same count on every
   * card keeps the cards one shape. Only the Product Model's resource types
   * carry these.
   */
  examples?: string[]
  /**
   * One short line.
   *
   * The two inventory sections render one card treatment at one height, and a
   * grid's rows equalise to its tallest card — so a note that wraps further
   * than its neighbours lifts every card around it. Capped in
   * `tests/integration/homeContent.test.ts`.
   */
  note: string
  /**
   * The real products a category is actually kept in, as brand marks.
   *
   * Only Today carries these, and they are the one thing that separates the two
   * inventories: the places are things a reader already owns and recognises,
   * the resource types are ideas that have no logo.
   *
   * Each is a tooltip and a link out to the product, which is what makes the
   * row worth its tab stops: a reader who does not recognise a mark can name it
   * without leaving, and one who does can go and check. They were decorative
   * and `aria-hidden` while they were only pictures — a focusable element
   * inside `aria-hidden` is a violation, so naming them and hiding them are no
   * longer both available.
   *
   * A mark drawn in a single near-black ink is the one thing the `logos`
   * collection gets wrong on the dark canvas; `HomeCard` names those and turns
   * them over.
   *
   * They ride the title's line rather than a row of their own, because
   * `landing.desktop.spec.ts` holds a card to the same height in both sections
   * and a band above the title would only grow one of them. Three marks is the
   * cap that line has room for at the width four cards are read.
   */
  logos?: BrandMark[]
  /**
   * The engraved plate for a resource type, as a path under
   * `/brand/icons/resource-types/`.
   *
   * The mirror of `logos`, and only the Product Model carries one: Today's
   * places are products with marks a reader already knows, and a resource type is an
   * idea nobody ships, so the answer to *what does this look like* has to be
   * drawn rather than borrowed.
   *
   * **Views of one kingdom**, in the same copperplate hand as the hero's
   * three ways in — see `docs/design/experiences/marketing.md`. Each plate is
   * drawn on a 16:9 sheet, which is the ratio the card's band cuts, so
   * `object-cover` crops nothing.
   */
  emblem?: string
  /**
   * Where this resource type is documented.
   *
   * Only the Product Model carries one, and every resource type must: a card that
   * shows a thing and names it should be able to say more about it, and the
   * plate is doing the work of an invitation. `HomeCard` spends it on the whole
   * card rather than a trailing link, so the target is the box a reader is
   * already looking at.
   *
   * **The page has to exist where the docs collection resolves** — see this
   * file's header. Checked for shape in `tests/integration/homeContent.test.ts`;
   * that it resolves is `docs.spec.ts`'s business.
   */
  to?: string
}

/**
 * One claim, said twice: once as it stands today and once with a Product Model.
 *
 * **The pair is the unit.** It used to be two parallel arrays kept in step by a
 * test that checked their icons matched; now a cost that loses its answer is
 * unrepresentable. The comparison section renders these rows directly, which is
 * the whole reason the page has one.
 */
export interface ComparisonRow {
  /** Shared by both halves — the same subject, seen from either side. */
  icon: string
  /**
   * What the row is about, in a word.
   *
   * The six read down the gutter as a taxonomy — *Definition, Agents, Done,
   * Drift, Decisions, After ship* — which is the index the glyphs alone never gave
   * a reader six rows in. Two words is the ceiling and one is the target;
   * `homeContent.test.ts` holds both, because a subject that wraps stops being a
   * label and starts being a third claim.
   *
   * Whether it is drawn at all, and where, is a treatment — see
   * `comparisonVariants.ts`.
   */
  subject: string
  before: ComparisonSide
  after: ComparisonSide
}

export interface ComparisonSide {
  /**
   * A predicate of the subject beside it, not a sentence about it.
   *
   * *Spread across many places*, under a gutter reading `DEFINITION`. The titles
   * used to restate the subject — *Your product model is scattered* against
   * *Your product model is centralized* — which spent the row's two most
   * valuable strings on a noun the reader was already looking at. The mark
   * carries it once; each half says only what it adds.
   */
  title: string
  /** One short line, for the same reason as `StateItem.note`. */
  description: string
}

/**
 * An inventory section: what the product's definition is made of, today or with
 * a Product Model.
 *
 * These do not carry consequences. That was the structure this page had before,
 * and it meant the costs were spent two screens early — a cost stated beside
 * its answer is a stronger sentence than a cost stated alone. Each section ends
 * on a single `verdict` instead, which is all the payoff an inventory owes.
 */
export interface HomeSection {
  /** Anchor id, and the hook the arrangements and the tests address it by. */
  id: string
  /**
   * Whether this section describes a state to escape or one to want.
   *
   * No longer spent as a tint. The two inventories carry no ground colour at
   * all — a washed panel behind a plain list of cards was decoration standing in
   * for an argument, and the argument is the comparison's. The tone survives
   * because the ordering rules and the tests still turn on which section is
   * which.
   */
  tone: 'negative' | 'positive'
  title: string
  description: string
  items: StateItem[]
  /**
   * How many columns the grid runs at on a wide screen.
   *
   * Each inventory owns its column count even though both currently contain
   * eight items and run four across. Their counts have diverged before and may
   * do so again; a grid that does not divide leaves an orphan in the last row,
   * which is checked in `tests/integration/homeContent.test.ts`.
   *
   * A card is still the same object in both: `HomeCard`'s floor holds it to one
   * height at either width, which is what the two sections read against one
   * another on when their column counts happen to match.
   */
  columns: 3 | 4
  /**
   * A closing sentence, where one is still owed.
   *
   * Both inventories dropped theirs. The Product Model section cannot carry one
   * without naming the tooling, which is the next section's job; and Today's
   * repeated what its own heading and subhead already say. A section that has
   * concluded in its heading does not need a box under it saying so again.
   */
  verdict?: string
  /**
   * Where this box continues — the documentation, or the post that makes its
   * argument at length.
   *
   * **One treatment, on all five boxes**, drawn in the corner by `MoreLink.vue`:
   * a small dimmed mono label, never a button. It replaced a filled *Read about
   * the Product Model* under this section — the only box that had a route
   * onward, which made it read as the one worth continuing, and put a second
   * call to action on a page whose only offer is the hero's three doors.
   *
   * **Two labels across the five: *View in docs* and *Read blog*.** The label
   * names the kind of place, not the page. Naming the page put a second title in
   * the corner of every box, and on the Product Model it repeated the heading a
   * foot above it word for word. `MoreLink` picks the glyph off the destination,
   * so the two kinds cannot be drawn with each other's mark.
   *
   * Required, here and on every other box: a standard that some sections keep
   * and others do not is not a standard, it is a decision taken five times.
   * This file's header rule applies to every one that leads to the docs — the
   * page has to exist where the collection resolves, or the corner is a 404.
   */
  more: HomeLink
}

/**
 * What runs a phase.
 *
 * A union rather than a name and a flag, because the distinction is the whole
 * point of showing it: two of the three phases are skills this product ships,
 * and the middle one is deliberately not — it is whatever the reader already
 * builds with. A pair of parallel fields could disagree about which is which;
 * this cannot, and `LoopPanel` picks the treatment off `kind` rather than off a
 * boolean somebody has to keep in step.
 *
 * `skill` carries the name written the way it is invoked. `yours` names the
 * reader's own flow — named, but never ours to name precisely.
 */
export type LoopRunner = { kind: 'skill', label: string } | { kind: 'yours', label: string }

/**
 * One phase of the working loop.
 *
 * The `id` is load-bearing: `LoopPanel` places all three around the ring by
 * name, so it is a layout hook as much as a key. Three is the count the wheel
 * draws — its cardinal ticks and arrows are on thirds, so a fourth phase would
 * need the geometry rebuilt, not just another entry here.
 */
export interface LoopPhase {
  id: string
  /** One word. It is set at display size beside the ring. */
  name: string
  runner: LoopRunner
  /** One short line, in the register `StateItem.note` uses. */
  note: string
}

/**
 * The working loop: what actually repeats once a Product Model exists.
 *
 * The two inventories say what the artifact is and where the reader's version
 * of it currently isn't; the comparison says what changes. None of them say
 * what the reader would *do* on a Tuesday. This does, and it is drawn as a
 * wheel because the shape is the argument — the three phases are a cycle, and a
 * numbered list would state that while a ring shows it.
 *
 * **Ideate comes first, and that is the whole claim.** Deciding what must be
 * true before the code exists is what separates this from documenting after the
 * fact; a loop that opened on Implement would be describing every team that already
 * has no model. Verify then closes it, because a cycle whose output is never
 * checked against reality is a diagram rather than a practice.
 *
 * Three phases, and no fourth. Resolution is not a station a person walks
 * to — it is what verify does on its own, so it belongs in verify's own note
 * rather than in a station of its own. A second figure drawing that inner loop
 * was built and cut: it doubled the section's height to explain a mechanism a
 * reader has no reason to care about until they are using the tool, and the
 * docs introduction is where that belongs.
 *
 * **Each phase names what runs it, and the middle one names something we do not
 * ship.** That asymmetry is the argument: ideate and verify are skills,
 * implement is whatever the reader already uses, and a figure that gave all
 * three the same treatment would be claiming an implementation tool this product
 * does not have. The phase is *Implement* rather than *Build* because build
 * also means a compile step and `pdd-kit export`'s `product-model/build/`,
 * and because the activity is what the docs and `CONTEXT.md` already call it.
 */
export interface HomeLoop {
  id: string
  title: string
  description: string
  /**
   * The two lines stacked inside the ring, set identically.
   *
   * Together they name the practice and whose implementation of it this is — the
   * wheel is a diagram of PDD, and without the centre it is a diagram of nothing
   * in particular. Not a wordmark: ADR-0007 rules out giving PDD its own mark,
   * and equal weight with the name above it is what keeps this a two-line label
   * rather than one.
   *
   * There is no eyebrow over the figure any more. *The working loop* named a
   * wheel that a heading two lines above already called a loop, and a figure
   * with only one thing in the box does not need a caption saying which figure
   * it is.
   */
  centerLabel: string
  centerMark: string
  /**
   * The return, in words.
   *
   * From `md` up the ring says this on its own — three arrows around a circle
   * are the direction of travel, and the reader supplies *and then round
   * again*. Below `md` the ring is either gone or shrunk to a compass, and a
   * loop whose last station is Verify is a three-step list. This is the line
   * that closes it, and it is the only part of the figure a screen reader could
   * ever have been given, at any width.
   *
   * It names Ideate outright rather than saying *start over*: the claim is that
   * the next change begins by moving the model, not by picking up the tools.
   */
  returnNote: string
  /** Clockwise from twelve o'clock. The order is the argument. */
  phases: LoopPhase[]
  /** See `HomeSection.more`. */
  more: HomeLink
}

const loop: HomeLoop = {
  id: 'the-loop',
  /**
   * Not "What changes with a Product Model" — that is the comparison's
   * heading, and two headings opening on the same three words read as one
   * section split in half.
   */
  title: 'One loop, run on every change.',
  /**
   * The ownership boundary, said in words. The wheel is signed pdd-kit/PDD
   * all the way round, so the dashed chip alone left a reader free to assume
   * the middle phase came with a tool of ours as well (issue #23). Since pdd#91
   * the reader's own agent implements when asked and verify checks each part, so
   * the sentence names who writes the code rather than a workflow.
   */
  description: 'Ideate and verify with pdd-kit. Your own agent implements, your way.',
  centerLabel: 'pdd-kit',
  centerMark: 'PDD',
  /**
   * Deliberately not the section description reworded. That sentence says who
   * runs each phase; this one says which station the next change starts at,
   * which is the thing a phone cannot see once the arrows are gone.
   */
  returnNote: 'Back to Ideate. The next change starts here.',
  /**
   * Two skills and one deliberate gap.
   *
   * The middle runner is the only one that names nothing this product ships,
   * and it is written as the reader's rather than as an absence: *your agent,
   * your way* is a real answer to "what runs this", where "none" would read as
   * a hole in the loop. Its note says the work arrives in phases, which
   * is verify's doing, and names the usual ways an agent implements; the section
   * description says outright that the agent is the reader's, so the handoff
   * does not depend on reading a dashed border.
   *
   * **These three notes are the loop's copy everywhere.** The `/docs` wheel
   * renders this object unchanged, and `pdd/docs/index.md` repeats the same
   * three notes word for word under it; change them in both places at once.
   */
  phases: [
    /**
     * The two skill notes name the Product Model outright rather than alluding
     * to it. The three phases are the only place on the page where the artifact
     * and the work meet, and *what must be true* / *what you build against* were
     * describing it without ever saying which thing was meant.
     *
     * Ideate does not say *desired state*, and verify says *agree* rather than
     * *sync*: both were state-model vocabulary a reader has no reason to know.
     */
    {
      id: 'ideate',
      name: 'Ideate',
      runner: { kind: 'skill', label: '/pdd-ideate' },
      note: 'Decide the next change and record it in the product model.'
    },
    {
      id: 'implement',
      name: 'Implement',
      runner: { kind: 'yours', label: 'your agent, your way' },
      note: 'In phases, with plan mode, an SDD tool, or freestyle.'
    },
    {
      id: 'verify',
      name: 'Verify',
      runner: { kind: 'skill', label: '/pdd-verify' },
      note: 'Check and improve the code and product model until they agree.'
    }
  ],
  /** The docs draw this same wheel on their Introduction, under its own heading. */
  more: { label: 'View in docs', to: '/docs#the-development-loop' }
}

/**
 * The closing hero: the thesis as a principle, and the one instruction that
 * acts on it.
 *
 * Unlike a `HomeSection` this is allowed a headline that wraps — it is a hero,
 * and heroes wrap. The line-length caps in
 * `tests/integration/homeContent.test.ts` deliberately do not reach it.
 */
export interface HomeClose {
  title: string
  description: string
  /**
   * Back to the hero, which is where the three ways in live.
   *
   * An in-page anchor rather than a route: the doors already exist at the top of
   * this page, and repeating them at the foot — as buttons, or by rendering the
   * hero's own CTA block a second time — put a second copy of the whole offer on
   * screen. This says *the way in is where you came in* and costs one link.
   */
  action: HomeLink
  /**
   * **No `more`, and that is the point.** Every box of information on this page
   * carries a corner link; the close is not one of them. It is a sub-hero whose
   * whole job is the single button under it, and a second route out of a block
   * that exists to make one offer is the mistake the three buttons made, in
   * smaller type. See `HomeSection.more` for the boxes that do carry one.
   */
}

/** The third section: the two states set against each other, row by row. */
export interface HomeComparison {
  id: string
  title: string
  description: string
  beforeLabel: string
  afterLabel: string
  rows: ComparisonRow[]
  /** See `HomeSection.more`. */
  more: HomeLink
}

const INSTALL_COMMAND = 'npx @itai-gendler/pdd-kit install'

/**
 * Every way in opens and closes the same way, so both steps are written once.
 *
 * `blueprint pull` does not strictly require `install` — npx runs it directly,
 * and pull writes orientation into `product-model/README.md`. It is still step one on
 * all three paths, deliberately: the skills are what you need the moment you
 * want to change or settle up a pulled Blueprint, and a hero that shows
 * `install` above the plates should not then contradict itself on one of them.
 */
const INSTALL_STEP: WayStep = {
  command: INSTALL_COMMAND,
  text: 'Installs the PDD skills.'
}

/**
 * The two ways in that start without code end the same way: the reader asks
 * for the build, their own agent implements it in phases, and verify checks
 * each phase before the next. There is no separate verify step to remember —
 * since pdd 0.28 asking to implement is what starts it. The ways it names are
 * the loop's implement note, word for word, so the two never drift apart.
 */
const IMPLEMENT_STEP: WayStep = {
  ask: 'implement it',
  text: 'Your own agent implements it in phases, with plan mode, an SDD tool, or freestyle. Verify checks each phase before the next starts.'
}

const hero = {
  eyebrow: 'Open source',
  title: 'Product-Driven Development for coding agents',
  /** Split so an arrangement can accent the audience without re-typing it. */
  titleLead: 'Product-Driven Development',
  titleAccent: 'for coding agents',
  /**
   * The problem first, then the answer and its three most important properties.
   * It has to state the value before the reader knows what a Product Model is.
   */
  description:
    'Your AI agent is guessing what the product is. PDD gives agents and humans a shared product model that is git-tracked, reviewable, and verifiable.',
  /**
   * The three ways in, as buttons rather than a section. Labels are verbs because
   * they are actions; two of the three continue in the documentation, which the
   * pages themselves make obvious.
   *
   * They are the hero's only actions. A broad *Get started* alongside them was
   * tried and dropped: the header carries that route on every page, and repeating
   * it here only asks the reader to choose between a door and the corridor all
   * three doors already open onto.
   */
  actions: [
    {
      id: 'from-your-repo',
      primary: true,
      moreLabel: 'View more in docs',
      plate: '/brand/icons/ways/plates/from-your-repo.webp',
      /**
       * Ends at the report, not at the loop. Adoption is done once the reader
       * can see their own product's model; what happens on every change after
       * that is the loop section's subject, and repeating it here made this the
       * one door with five steps.
       */
      steps: [
        INSTALL_STEP,
        { command: '/pdd-map', text: 'Reads the code without running it, asks what the code can\'t answer, and writes the model once you approve.' },
        { command: 'npx @itai-gendler/pdd-kit view', text: 'Opens your product model as a report in the browser.' }
      ] satisfies WayStep[],
      label: 'Map existing repo',
      shortLabel: 'Existing repo',
      to: '/docs/from-your-repo'
    },
    {
      id: 'from-an-idea',
      moreLabel: 'View more in docs',
      plate: '/brand/icons/ways/plates/from-an-idea.webp',
      steps: [
        INSTALL_STEP,
        { command: '/pdd-ideate a booking app for dog walkers', text: 'Proposes distinct product shapes, then writes the one you pick once you approve it.' },
        IMPLEMENT_STEP
      ] satisfies WayStep[],
      label: 'Start from an idea',
      shortLabel: 'From an idea',
      to: '/docs/from-an-idea'
    },
    {
      id: 'from-a-blueprint',
      moreLabel: 'Browse the catalog',
      plate: '/brand/icons/ways/plates/from-a-blueprint.webp',
      steps: [
        INSTALL_STEP,
        { blueprint: 'content-feed-reader', text: 'Pulls the Blueprint you pick into product-model/.' },
        IMPLEMENT_STEP
      ] satisfies WayStep[],
      label: 'Start from a Blueprint',
      shortLabel: 'From a Blueprint',
      to: '/blueprints'
    }
  ] satisfies HeroAction[],
  /** Every way in begins with this line, which is why the hero can lead with it. */
  installCommand: INSTALL_COMMAND,
  commandCopyLabel: 'Copy command',
  commandCopiedLabel: 'Command copied',
  /** The overlays' accessible description, which never renders visibly. */
  actionsQuestion: 'Where are you starting?'
}

/**
 * *Where is your product model today?* — asked of a reader who now knows what one is,
 * and answered by the eight places the pieces are actually scattered across.
 *
 * The heading is a question because the honest answer is *you do not have one*,
 * and a reader will reach that themselves faster than they will accept being
 * told. The subhead does the telling: scattered, unshared, unchecked.
 *
 * The costs this state produces are not here — they are in the comparison,
 * beside the answers to them, because a cost read next to its answer lands in
 * one eye movement and a cost read two screens earlier is old news by the time
 * the answer arrives.
 */
const today: HomeSection = {
  id: 'today',
  tone: 'negative',
  /**
   * A question, not a claim. It also carries no count: the headline used to say
   * *six places*, which meant re-cutting the sentence every time the list grew —
   * it is eight now — and it ran to two lines at the width a heading is read.
   */
  title: 'Where is your product model today?',
  /**
   * The description carries no count either, and for the same reason. It names
   * where the pieces sit — information sources, systems, and people — rather
   * than how many places they sit in, so growing the list below does not date
   * the sentence above it.
   */
  description: 'Scattered across your organization’s information sources, systems, and people, shared by none, checked by nothing.',
  columns: 4,
  /**
   * Each place is shown in the products it is actually kept in. A reader
   * recognises their own stack faster than they read a category name, and the
   * marks are what turn an abstract list into an inventory of tabs they have
   * open right now.
   *
   * Three per card, and never the same mark twice: a product that appears under
   * two headings says the headings overlap, which is the opposite of the point.
   * People is the exception and deliberately so — it is the only row no vendor
   * sells, so it takes the `users` glyph the comparison already spends on
   * *knowledge leaves with the people*.
   */
  items: [
    {
      title: 'Tickets',
      note: 'Written before the work, never corrected after',
      logos: [
        { icon: 'i-logos-jira', name: 'Jira', to: 'https://www.atlassian.com/software/jira' },
        { icon: 'i-logos-linear-icon', name: 'Linear', to: 'https://linear.app' },
        { icon: 'i-logos-asana-icon', name: 'Asana', to: 'https://asana.com' }
      ]
    },
    {
      title: 'Design docs',
      note: 'It shipped differently, and nobody went back',
      logos: [
        { icon: 'i-logos-google-drive', name: 'Google Drive', to: 'https://workspace.google.com/products/drive/' },
        { icon: 'i-logos-notion-icon', name: 'Notion', to: 'https://www.notion.com' },
        { icon: 'i-logos-dropbox', name: 'Dropbox', to: 'https://www.dropbox.com' }
      ]
    },
    {
      title: 'The wiki',
      note: 'Accurate on the day it was written',
      logos: [
        { icon: 'i-logos-confluence', name: 'Confluence', to: 'https://www.atlassian.com/software/confluence' },
        { icon: 'i-logos-obsidian-icon', name: 'Obsidian', to: 'https://obsidian.md' },
        { icon: 'i-logos-coda-icon', name: 'Coda', to: 'https://coda.io' }
      ]
    },
    {
      title: 'Chat threads',
      note: 'Where the decisions were really made, and lost',
      logos: [
        { icon: 'i-logos-slack-icon', name: 'Slack', to: 'https://slack.com' },
        { icon: 'i-logos-microsoft-teams', name: 'Microsoft Teams', to: 'https://www.microsoft.com/microsoft-teams/group-chat-software' },
        { icon: 'i-logos-discord-icon', name: 'Discord', to: 'https://discord.com' }
      ]
    },
    {
      title: 'UX tools',
      note: 'Flows and screens the build moved on from',
      logos: [
        { icon: 'i-logos-figma', name: 'Figma', to: 'https://www.figma.com' },
        { icon: 'i-logos-sketch', name: 'Sketch', to: 'https://www.sketch.com' },
        { icon: 'i-logos-miro-icon', name: 'Miro', to: 'https://miro.com' }
      ]
    },
    {
      title: 'Source code',
      note: 'Shows what it does, never what it must do',
      logos: [
        { icon: 'i-logos-github-icon', name: 'GitHub', to: 'https://github.com' },
        { icon: 'i-logos-gitlab-icon', name: 'GitLab', to: 'https://gitlab.com' },
        { icon: 'i-logos-bitbucket', name: 'Bitbucket', to: 'https://bitbucket.org' }
      ]
    },
    {
      title: 'Tests',
      note: 'Say what is, not what must be',
      // Vitest rather than Cypress: Cypress's mark is a dark teal disc that
      // sinks into the dark panel, and it is the one place here where a
      // straight swap buys the contrast instead of an inversion.
      logos: [
        { icon: 'i-logos-jest', name: 'Jest', to: 'https://jestjs.io' },
        { icon: 'i-logos-vitest', name: 'Vitest', to: 'https://vitest.dev' },
        { icon: 'i-logos-playwright', name: 'Playwright', to: 'https://playwright.dev' }
      ]
    },
    {
      title: 'People',
      note: 'Leave when they leave',
      logos: [{ icon: 'i-lucide-users', name: 'The people who were there' }]
    }
  ],
  /**
   * The one corner on the page that leads to the blog rather than the docs, and
   * the only box where that is the right answer: this section is the distilled
   * form of `your-agent-is-guessing`, and the post is where the same argument is
   * made at length. Documentation would answer a question this section has not
   * asked yet — it states the problem, and the pages that solve it are behind
   * the three boxes below.
   */
  more: { label: 'Read blog', to: '/blog/your-agent-is-guessing' }
}

/**
 * What a Product Model is — and **nothing about how this product implements
 * one**.
 *
 * It opens the page, before the reader has been told they lack one. Defining
 * the thing first is what lets the next section ask *where is yours* and have
 * the question land; asking it of a reader who does not yet know what is being
 * asked for lands as a sales question instead.
 *
 * No tooling here, therefore: no `product-model/`, no CLI, no validation. Those
 * belong to the section that introduces the implementation, two below. The
 * closing verdict went for exactly that reason — it could not be written
 * without naming the tool.
 */
const productModel: HomeSection = {
  id: 'product-model',
  tone: 'positive',
  /**
   * The name of the artifact, and nothing else.
   *
   * This is the one section whose subject is a thing rather than a claim, and it
   * is the thing the whole site is about — so the heading names it and the
   * sentence that used to be the heading moved down a line to describe it. A
   * reader scanning the page now finds *Product Model* where the other three
   * boxes state a position, which is the correct asymmetry: the others argue,
   * this one defines.
   *
   * Not the eyebrow coming back. An eyebrow sat *above* a heading and restated
   * it; here the two say different things, and one of them is the term the rest
   * of the site, the format and the documentation all use.
   */
  title: 'Product Model',
  /**
   * The old heading, demoted intact.
   *
   * It is the shortest true description of the artifact the project has, which
   * is why it survived every rewrite of this section; under a heading that names
   * the thing, it finally reads as the definition it always was rather than as a
   * claim being made.
   *
   * It replaced *Who it serves, how they reach it, what it can do, and what must
   * stay true* — the four questions the resource types answer, which is a good line
   * and belonged to a head whose title was a sentence. Two sentences stacked
   * would have made the head longer than the argument under it.
   */
  description: 'One definition of what your product does.',
  /**
   * Seven main collections; contained types are left to the documentation.
   * Four to a row, so the last row holds three and centres rather than leaving
   * one card alone.
   */
  columns: 4,
  items: [
    { title: 'Entities', note: 'What the product keeps, and who acts on it', examples: ['Order', 'Customer', 'Payment provider'], emblem: '/brand/icons/resource-types/entities.webp', to: '/docs/entities' },
    { title: 'Interfaces', note: 'How people and systems reach the product', examples: ['Web app', 'Mobile app', 'Partner API'], emblem: '/brand/icons/resource-types/interfaces.webp', to: '/docs/interfaces' },
    { title: 'Domains', note: 'The subject areas the product is split into', examples: ['Ordering', 'Catalog', 'Billing'], emblem: '/brand/icons/resource-types/domains.webp', to: '/docs/domains' },
    { title: 'Capabilities', note: 'What the product lets someone do', examples: ['Check out', 'Cancel order', 'Refund'], emblem: '/brand/icons/resource-types/capabilities.webp', to: '/docs/capabilities' },
    { title: 'Journeys', note: 'One goal, carried across several capabilities', examples: ['Browse and buy', 'Sign up', 'Reorder'], emblem: '/brand/icons/resource-types/journeys.webp', to: '/docs/journeys' },
    { title: 'Business rules', note: 'What must always hold, and who may do what', examples: ['Max 3 per order', 'Only managers refund', 'Total includes tax'], emblem: '/brand/icons/resource-types/business-rules.webp', to: '/docs/business-rules' },
    { title: 'Variations', note: 'Where the product works in more than one way', examples: ['Feature flag', 'Plan tier', 'A/B test'], emblem: '/brand/icons/resource-types/variations.webp', to: '/docs/variations' }
  ],
  /** The page that introduces the collections and their child resource types. */
  more: { label: 'View in docs', to: '/docs/product-model' }
}

/**
 * The third section, and the one the first two are built to earn: six problems
 * and the six answers to them, set against each other.
 *
 * Each row is one claim said twice. They share an icon because they share a
 * subject — this is the same thing seen from either side, which is the argument
 * the whole page makes.
 *
 * **Order matters, and it follows one ordinary change.** First, where the
 * product definition lives and what an agent receives. Then what *done* means,
 * how drift is found, where decisions travel, and what remains after the change
 * ships. Each row answers a question a team already asks; none requires the
 * reader to decode a new concept before the comparison can make its point.
 *
 * **This is where the implementation is introduced.** The two sections above
 * define the artifact and show that the reader has no single home for it; this
 * one names what closes that gap, and its rows are the evidence.
 *
 * It no longer names pdd-kit in prose — the eyebrow that did went with the
 * others. The header, the footer and the close all name it, so the page is not
 * silent about the product; this section names the *practice* and demonstrates
 * it, which is the order public copy is supposed to run in anyway.
 *
 * Both halves of a row are held to roughly one length. They sit side by side,
 * so a long *before* against a short *after* tilts a row that is supposed to
 * balance.
 */
const comparison: HomeComparison = {
  id: 'before-and-after',
  title: 'What changes with a product model.',
  /**
   * One sentence names the three jobs the rows unpack: guide the change, give
   * the team one shared reference, and remain current afterwards. The wording
   * stays at the level of the PDD concept rather than naming the implementation
   * skill that performs the check.
   */
  description: 'One shared definition guides the work and stays current as the product changes.',
  /**
   * The comparison names its condition explicitly. *Before* and *After* made a
   * reader infer what caused the change; these labels answer that once for all
   * six rows.
   */
  beforeLabel: 'Without a product model',
  afterLabel: 'With a product model',
  rows: [
    {
      icon: 'i-lucide-boxes',
      subject: 'Definition',
      before: {
        title: 'Spread across many places',
        description: 'Tickets, docs, chats, code and people each hold a piece.'
      },
      after: {
        title: 'Written in one product model',
        description: 'It lives beside the code and links back to those sources.'
      }
    },
    {
      icon: 'i-lucide-bot',
      subject: 'Agents',
      before: {
        title: 'Work out what you meant',
        description: 'They infer behavior and rules from whatever they can find.'
      },
      after: {
        title: 'Know what to build',
        description: 'They get journeys, scenarios and rules before they start.'
      }
    },
    {
      icon: 'i-lucide-circle-check-big',
      subject: 'Done',
      before: {
        title: 'The code is finished',
        description: 'It can work correctly and still miss product intent.'
      },
      after: {
        title: 'The code matches the product',
        description: 'Approved scenarios make the expected behavior clear.'
      }
    },
    {
      icon: 'i-lucide-siren',
      subject: 'Drift',
      before: {
        title: 'Found when someone notices',
        description: 'Old docs can look correct long after behavior changes.'
      },
      after: {
        title: 'Differences are easier to find',
        description: 'The model provides a clear reference as behavior changes.'
      }
    },
    {
      icon: 'i-lucide-git-pull-request',
      subject: 'Decisions',
      before: {
        title: 'Often live outside the code',
        description: 'The reason is left in a ticket, document or conversation.'
      },
      after: {
        title: 'Travel with the code',
        description: 'Model and code updates are reviewed together in the PR.'
      }
    },
    {
      icon: 'i-lucide-history',
      /**
       * The label names the point in the workflow rather than another artifact.
       * This last row is the durable distinction: a request becomes history,
       * while its approved behavior remains part of the current definition.
       */
      subject: 'After ship',
      before: {
        title: 'The request becomes history',
        description: 'Tickets and specs explain changes, not today\'s product.'
      },
      after: {
        title: 'The model stays current',
        description: 'Approved behavior remains part of the product definition.'
      }
    }
  ],
  /**
   * The documentation's own front door, which is where the six answers on this
   * side of the comparison are each explained at length. No single page covers
   * the row set, so this is the one corner that opens the index rather than a
   * page.
   */
  more: { label: 'View in docs', to: '/docs' }
}

/**
 * The missing piece: shows the Product Model at the centre, with every other
 * information source focused on its own concern.
 *
 * Sits between Today and the comparison. Bring the existing definition together,
 * surface gaps for the team to resolve, and give each source a shared foundation.
 * The FAQ explains the boundaries between product decisions, design, and code.
 *
 * The chosen volvelle illustration matches the five source rows. The product
 * model is the shared foundation in the opening paragraph and image center.
 */
interface MissingPieceLayer {
  label: string
  description: string
}

export interface HomeMissingPiece {
  id: string
  title: string
  description: string
  stackCaption: string
  layers: MissingPieceLayer[]
  image: string
  imageAlt: string
  more: HomeLink
}

const missingPiece: HomeMissingPiece = {
  id: 'missing-piece',
  title: 'Clear product model. Focused sources.',
  description: 'Bring knowledge from docs, designs, code, and people into one product model. Fill gaps, clarify uncertainty, and make every source leaner and more focused.',
  stackCaption: 'Each information source’s purpose, supported by a shared product model',
  layers: [
    { label: 'User docs', description: 'Teaches people to use the product' },
    { label: 'Internal docs', description: 'Records architecture, design decisions, and onboarding' },
    { label: 'Design & architecture', description: 'Describes how it should look and work' },
    { label: 'Code & tests', description: 'Implements and verifies how it is built' },
    { label: 'Tickets, chats & people', description: 'Carry context, requests, and undocumented knowledge' }
  ],
  image: '/brand/missing-piece/product-knowledge.webp',
  imageAlt: 'An engraved wheel with the product model at its center, connecting user-facing documentation, internal documentation, design and architecture, code and tests, and tickets, chats, and people.',
  more: { label: 'Read blog', to: '/blog/your-agent-is-guessing' }
}

/**
 * The close, and the reason it is back.
 *
 * This section was cut when the page was two sections long, because a headline
 * restating the thesis to a reader who had *just finished the argument* is a
 * second hero. That objection was right then and does not hold now: the page
 * ends on a comparison, which is a payoff rather than a thesis, so a principle
 * arriving after it reads as a conclusion drawn rather than a claim repeated.
 *
 * It sends the reader back to the hero rather than carrying doors of its own.
 * Three buttons here were a second, weaker set competing with the hero's;
 * rendering the hero's own CTA block again was worse still — the full offer,
 * twice, on one page. One link back to where the doors already are says the same
 * thing and adds nothing to the page.
 *
 * The headline is one of the four in `docs/messaging-system.md#headline-library`
 * — the strongest line the project has, and the one that reads best cold. It
 * names no problem and no audience, which is why it works here and not at the
 * top of the page.
 */
const close: HomeClose = {
  title: 'AI agents and humans need a living product model.',
  description:
    'pdd-kit is open source and MIT licensed. No account is required to use the format or pull a Blueprint.',
  action: { label: 'Get started', to: '#start' }
}

/**
 * The body of the page: the artifact, the gap, then what closes it.
 *
 * The Product Model is defined before the reader is told they lack one —
 * *where is your product model today?* only lands as a question if the reader already
 * knows what is being asked for.
 */
const sections: HomeSection[] = [productModel, today]

export const homeContent = {
  hero,
  sections,
  missingPiece,
  comparison,
  loop,
  close
}

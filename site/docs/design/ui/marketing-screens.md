# Marketing Screens

read_when: changing the shared header, home page, contact page, or FAQ.

The marketing surface explains what Product-Driven Development is and why the
format is open. It sells nothing: there is no pricing page, trial, or
signup call to action.

The screens share `app/layouts/default.vue` — the preview bar (hidden by
default), `landing/Header.vue`, the page, and `landing/Footer.vue`. All of them
are generated as static files.

## Shared header

The four navigation links occupy an independent center column on desktop.
Search documentation and Vocabulary are always available in the right utility
group, including on Blueprint reports. Entering docs leaves navigation in place.
Below `xl`, GitHub uses its icon and the header's Get started action is hidden;
below `lg`, navigation and Get started are in the mobile menu. Both lookup
buttons and the GitHub icon remain visible on phones, with accessible names and
tooltips, so the repository is reachable without opening the menu.
Below `sm` (640px), the header and mobile menu show the logo mark and release
badge without the wordmark, leaving room for both lookups. The brand and utility groups do not shrink into one another.

Documentation search uses ⌘/Ctrl+K. On Blueprint detail pages, the report keeps
that shortcut for model search and the header uses ⌘/Ctrl+Shift+K, shown in its
tooltip. Vocabulary uses a separate state key from the report's own panel, so a
site lookup opens one dialog and can follow documentation links in the same tab.
On Blueprint reports, the header is the only Vocabulary navigation entry and
its panel includes Show/Hide tooltips for the report. The report's contextual
term lookups remain available without a second sidebar entry.

The header comparison is settled. Its row, registry, and cookie handling are
removed; the centered navigation and global tools apply on local and deployed
hosts alike.

## MKT-01 — Home

Route: `/`

The missing-piece section uses the selected side-by-side layout and the heading
“Clear product model. Focused sources.” Its opening paragraph names
the product model as the shared definition, then connects clarifying uncertainty
and filling gaps with leaner, clearer information sources focused on their
purpose. There is no extra paragraph above
the five-row source table and no Product Model row.
The heading uses the standard centered measure to fit one desktop line beside
“Read blog”; the shortened description fits two. Both wrap on smaller screens.
Source labels are shortened to “User docs”, “Internal docs”, “Design &
architecture”, “Code & tests”, and “Tickets, chats & people” and stay on one line
on desktop. The focus column retains its original wording, including “and”, and
can wrap to two lines.

The selected printed volvelle is updated to match those five rows: user-facing
documentation; internal documentation; design and architecture; code and tests;
and tickets, chats, and people. The product model remains at its center. The
square illustration uses soft parchment and fine ink, without a tabletop or
envelope, and is contained without cropping. Its layout, image, and copy
experiments are removed; the shared background lab remains.
The image and generation prompt live in `public/brand/missing-piece/`.

The source table, generated FAQ tables, and Markdown tables share the
`content-table` treatment in `app/assets/css/main.css`: warm-stone headers
(`bg-neutral-200`, `text-neutral-950`), lightly filled body rows, bold first
columns, horizontal separators, and a rounded outer border. The FAQ retains
its highlighted Product Model row. The table-header experiment is removed.

Six sections after the hero, in the order set out in
[marketing](../experiences/marketing.md#the-argument-in-order): **The Product
Model** — seven main resource collections, and no tooling — then **Where is your product
model?** — the eight places the pieces are scattered across — then the shared
definition and source-purpose section described above, then
**pdd-kit**, which introduces the implementation and carries the
before-and-after, then **The working loop**, then **Get started**.

The artifact is defined before the reader is told they lack one; both the order
and the no-tooling rule are asserted in `tests/integration/homeContent.test.ts`.
Neither inventory carries consequences or a closing verdict — those belong to
the comparison, beside the answers to them.

`HomeLayout.vue` assembles it. `SectionPanel.vue` is both inventories — one
component, which is what makes them read as two answers to one question —
`HomeCard.vue` the single card they share, and `SectionHead.vue` the centred
heading all three use. Every box of information carries one link in its top right
corner, drawn by `MoreLink.vue` as a dimmed mono label rather than a button —
*View in docs* on three of them, *Read blog* on Today. The head requires it, so a
panel cannot ship without saying where it continues. The close is the exception
and carries none: it is a sub-hero with one button, not a box of information.

From `lg` the corner link sits on the heading's own line, absolutely placed
against the panel's padding, and the centred head reserves its width on both
sides so a long heading wraps rather than running under it. Below `lg` the link
takes a line of its own above the heading: a balanced heading fills the panel at
those widths, and there is no corner left to sit in.

The comparison is settled in every respect — one row per claim, two columns, the
answer raised and the problem flat, and the row's subject named in a word in the
gutter between them. `LedgerComparison.vue` draws it and the copy is
`app/utils/homeContent.ts`; see
[round seven](../experiences/marketing.md#round-seven-settled-the-gutter-it-names-the-row)
for the four placements that lost. The hero's cover is fixed in `landing.css`:
the lightest scrim the desktop copy can take, and a mid-strength wash below
`xl`.

The hero animation is an entrance rather than a loop. Sections below the fold
animate on scroll through `useLandingMotion`, which resolves to a zero-duration
animation under reduced motion.

| State | Shows |
| --- | --- |
| `MKT-01.default` | the full page |

## MKT-05 — Contact

Route: `/contact`

The hero's title is the page name, "Contact", in the brass accent
(`text-primary`), centered over one sentence of context. Below it, three ways
through, ordered by how likely they are to be the right one: email,
a GitHub issue, or starting from a Blueprint. There is no contact form, so the
site collects nothing here.

| State | Shows |
| --- | --- |
| `MKT-05.default` | the three routes through |

## MKT-06 — FAQ

Route: `/faq`

Command examples use the landing page's shared `CommandBlock`: syntax colors,
a shell prompt where appropriate, and a copy control. Each command stays on one
line and scrolls horizontally on narrow screens, with prose in separate paragraphs.
Overflowing commands receive keyboard focus so readers can scroll the full line.

The hero's title is the page name, "FAQ", in the brass accent (`text-primary`),
centered, with no caps label and no subtitle. Five groups follow: **Why a
Product Model**, **Adopting it**, **What it is and isn’t**, **Getting started**,
and **Trust and help**. **Getting started** asks where the visitor actually is —
an existing codebase, an idea, or wanting a proven starting point — plus what
lands in the repository, when to map or verify, and the projects supported
today. **Trust and help** covers cost, what leaves the machine,
contributing, and help.

Questions are phrased as the visitor's situation rather than as glossary lookups;
definitions live on the home page and in the documentation. Copy lives in
the repository's `docs/faq.md`, and answers start collapsed behind an accordion — the
page is a list of situations to scan for your own, not a document to read
through. Any number of answers can be open at once, and opening or closing one
never moves the page; the reader scrolls.

The page uses the docs' `UPage` grid, so the index behaves exactly as it does
on a docs page. From `lg` it is the on-this-page `UContentToc` in the right
rail; an empty left column keeps the docs' 2/6/2 split, so the groups stay
centered under the title. Below `lg` the same component is the docs' sticky,
collapsible "On this page" bar, and choosing a group closes it so the list does
not cover the heading. Groups are open sections divided by a rule, not boxed
cards: on a phone a card's border and padding cost a fifth of the reading width
and framed every answer table three deep. The closing call to action is the one
boxed panel. Below `sm` the three-column comparison tables read as stacked
label-and-value rows, and the two-column source table lets its labels wrap.
Every question has its own address, `/faq#<question-slug>`: opening one
writes it to the URL, and loading that URL opens it.

The parsed Markdown becomes structured answer parts so a link can sit
inside a sentence without `v-html`. Documentation links point only at pages that
exist in the same checkout — the docs collection is read from it at build time,
and generation fails on a link to a page that does not exist.

| State | Shows |
| --- | --- |
| `MKT-06.default` | every question, collapsed |


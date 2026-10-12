# Documentation Screens

read_when: changing the docs route, the docs sidebar, or the docs frontmatter contract.

Documentation is not authored in `site/`. The pages come from the repository's
`docs/` through Nuxt Content and are generated with the site, so a docs change
and the page that shows it land in one pull request. Under `pnpm dev`, edits
there hot-reload.

One route serves all of it: `app/pages/docs/[...slug].vue`, written here as
`/docs/**`.

## The frontmatter contract

Enforced loosely on purpose, in `content.config.ts`:

- `group` names the sidebar cluster.
- `order` sorts within it.

Both are optional, so a page without them still builds. The navigation
clusters by `group`; there are no section tabs, because docs is one surface.
The tabs that used to sit here existed only to switch between the open format
and a Platform this product does not have.

Experiences and Screens are sections within Interfaces, reached through the
standard article table of contents. The sidebar keeps its existing grouped
navigation, with one Interfaces entry and no nested resource topics.

## DOC-01 — Documentation

Route: `/docs/**`

Sidebar, article, and in-page navigation. The index and a leaf page are listed
separately because they are the same component under materially different content:
the index has no prose body to speak of, and a leaf page is where the typography,
code blocks, and callouts actually get exercised.

Markdown tables use the same `content-table` styles as the landing page and
FAQ: warm-stone headers, lightly filled body rows, bold first columns,
horizontal separators, and a rounded outer border. Nuxt UI's prose table
renderer receives the shared classes through `app/app.config.ts`; Markdown
authors do not need presentation markup. Wide tables remain scrollable.

| State | Shows |
| --- | --- |
| `DOC-01.index` | `/docs` — the entry page and the full sidebar |
| `DOC-01.page` | `/docs` — prose, code, and callouts |
| `DOC-01.vocabulary` | `/docs/entities` — shared Vocabulary panel with Entities expanded |

Vocabulary sits beside search in the header, with an icon and accessible name
on narrow screens. Its slideover starts at the current page's group; the article
and sidebar stay in place underneath. Search, linked definitions, and **Back to…**
use the report's shared panel. Documentation links close it and open the owning
heading in the same tab. Dismissing it returns focus to the header button.

The [shared header](./marketing-screens.md#shared-header) centers navigation and
offers search and Vocabulary on every page. Dialogs are mounted in the default
layout; the sidebar stays owned by the docs layout so its reading position
survives links.

# The catalog index has one layout

read_when: changing the `/blueprints` layout, its loading or empty states, its
search or category controls, or the URL parameters the listing reads.

## Context

The catalog index stretched across the full viewport with up to four columns,
judged against thirty fixture cards. The real catalog lists one, which rendered
as a quarter-width card beside a sidebar holding one category
([#26](https://github.com/businesslens/landing/issues/26)).

A count-driven design was considered and built: a featured card for one
Blueprint, a small grid without controls for two to five, and search only from
six. It was dropped before merge. The catalog is expected to pass five
Blueprints well before launch, so those arrangements would exist for a few
weeks and then stay in the code for good.

## Decision

The index has one layout at every size: the hero, search, a result row, and a
grid. Around it are three states:

| State | Shows |
| --- | --- |
| loading | Placeholders shaped like the search row, the result row, and the cards. |
| empty | An empty state offering Request and Submit. A reachable empty catalog is a 200. |
| unavailable | The outage notice, under a 503. |

Loading is only ever seen after client-side navigation. The server waits for
the list before it renders, but a browser arriving from another page fetches it
afterwards. Without the loading state, that moment read as "No Blueprints yet".

The category sidebar is the one part that depends on the catalog. It appears
from `lg` only when there is more than one category; below `lg` the toolbar's
category select takes its place.

The result row says "6 Blueprints" until something narrows it, then
"3 results", "1 result", or "No results" — never "1 of 1".

The listing uses the full viewport, keeping only the gutters, and the grid
grows to four columns on wide screens. It first used the site container with
three columns, which suited a catalog of one; with fifteen Blueprints that left
most of a wide screen empty, so the full width came back.

Search and category live in the URL as `?q=` and `?category=`, written with
`replace`. A filtered listing survives a reload, a shared link, and a trip to a
record and back, without each keystroke adding a history entry. The server
reads the same parameters, so the response is deterministic for its URL and
still identical for every viewer. Favorites stay out of the URL because they
are the viewer's own shelf. The canonical link already drops the query.

## Consequences

- A small catalog leaves gaps in a wide grid; the launch catalog of fifteen
  fills it, and the layout does not change with the count.
- E2E coverage of the states answers the browser's listing request with
  `tests/support/catalog.ts` instead of seeding the database. The real published
  row stays covered by `blueprints.spec.ts`.
- The favorites filter sits in the fixed-height result row, not the toolbar,
  so its arrival after hydration moves nothing.

# System Screens

read_when: changing error pages or any state that is not a product surface.

System screens are what the site shows when there is no page to show. They are
not a product experience, which is why `SYS` is reserved rather than listed
alongside the surfaces in [`README.md`](./README.md).

## SYS-01 — Not found

Route: any unmatched path — generated as `404.html`

**`app/error.vue` renders the error inside `default.vue`,** so a visitor who
mistypes a URL still gets the header, the footer and the wordmark. The title is
a plain statement in the brass accent — "Page not found", or "Something went
wrong" for any other status — matching the secondary pages' titles. Under it,
the status code and the requested path, set in mono with `overflow-wrap:
anywhere` so a long hyphenated slug never splits mid-word or runs off a phone.
Three ways on: the home page, the catalog and the docs.

It is the same page for every unmatched path — an unknown marketing route, an
unknown docs route, or an unknown Blueprint slug. `nuxt generate` writes it as
`404.html`, which static hosts serve for any path that was not generated, and
the app renders it for an unmatched in-app navigation.

| State | Shows |
| --- | --- |
| `SYS-01.not-found` | the error page inside the site shell |

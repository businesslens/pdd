# Documentation

read_when: changing the docs route, how docs are read from the repository, or terminology.

The documentation on `pdd-kit.dev/docs` is the open format's documentation.
It is authored in the repository's `docs/` and rendered by the site in `site/`
of the same repository.

Screens are in [documentation screens](../ui/documentation-screens.md).

## Why it lives beside the code

The format, the CLI, and the skills ship together and are versioned together. A
docs page that described a flag differently from the CLI that implements it
would be wrong in a way no test could catch. Keeping the words next to the code
they describe, and the site in the same repository, means a change and the page
that shows it land in one pull request. The FAQ (`docs/faq.md`) and the
changelog (`CHANGELOG.md`) are read the same way.

## The contract

Nuxt Content reads the repository's `docs/**` (except `faq.md`) with a `/docs`
prefix. Two optional frontmatter keys shape the navigation:

- `group` — the sidebar cluster the page belongs to.
- `order` — its position within that cluster.

Both are optional, so a page without them still builds.

Experiences and Screens are sections of the Interfaces document, with their
file examples and rules on the same page. The standard table of contents links
to those sections. They have no separate sidebar entries.

Link previews use each document's title and description in generated
Open Graph and Twitter metadata. `app.vue` supplies the same current
`/product-model-open-graph.png` image used by the homepage, so docs do not retain
an older social card when the homepage artwork changes. Every document below the
index also emits a `BreadcrumbList` of Home › Docs › the document.

## Terminology must agree

[`CONTEXT.md`](../../../CONTEXT.md) owns internal vocabulary. Public definitions
live on the corresponding Product Model pages in the repository's `docs/`;
there is no standalone glossary page. Review `CONTEXT.md` and every affected
resource type page together in the same pull request.

The header's Vocabulary button opens the report layer's shared slideover beside
docs search on every page in the shared site layout. It uses the generated
definitions shipped in `@itai-gendler/pdd-kit`, with the current page's group
expanded. Pages without terms start at Product.
Search and linked definitions retain the panel's return trail; **Read more**
closes it and navigates to the owning docs heading in the same tab. Closing a
lookup keeps the reader's article and scroll position. There is no vocabulary
page or automatic inline annotation of the article.

Navigation stays centered across site and docs pages. The site's lookup panel
is independent of a Blueprint report's own Vocabulary panel. On report pages,
the report retains ⌘/Ctrl+K and documentation search uses ⌘/Ctrl+Shift+K; on other
pages documentation search uses ⌘/Ctrl+K.

This integration uses the panel API of the workspace's `@itai-gendler/pdd-kit`
package, so a change to the panel and its use on the site land together.

## One surface, no tabs

Docs is a single navigation tree clustered by `group`. There are no section tabs
or alternate documentation surface. Removed `/docs/platform/**` paths are not
generated.

## Local development

`pnpm dev` in `site/` reads `../docs` and `../CHANGELOG.md` from the checkout,
and edits there hot-reload. There is nothing to link or configure.

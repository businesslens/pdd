# Catalog

read_when: changing what a visitor can do with a Blueprint.

The catalog is the product. Everything else on `pdd-kit.dev` explains it.

Screens and their states are in [catalog screens](../ui/catalog-screens.md);
this document is the behavior.

## Who does what

| Actor | Can | Needs |
| --- | --- | --- |
| Visitor | browse Blueprints, open a record, copy the pull command | nothing |
| Puller | `pdd-kit blueprint pull <slug>` | nothing |
| Contributor | `pdd-kit blueprint contribute`, which opens a pull request against `itai-gendler/pdd-kit` | a GitHub account |
| Maintainer | merge the pull request, which publishes the Blueprint | write access to the repository |

The important row is the second one. **Pulling is anonymous** — no account, no
credential, no rate-limit token. A visitor can go from never having heard of the
product to a working `product-model/` directory without signing up for
anything. The site has no accounts at all.

## Browse

`/blueprints` lists every Blueprint in the repository's `blueprints/`. It is one
flat listing, not a hierarchy: there are no collections, no folders, and no
per-viewer ordering. It has one layout at every size — search, category
filters, a result row, and a grid — with distinct empty-result and unavailable
states; see [ADR-0019](../../adr/0019-the-catalog-index-has-one-layout.md).
Cards wear the Blueprint cover, or the Product logo when there is none
([ADR-0020](../../adr/0020-catalog-cards-wear-the-product-logo.md),
[ADR-0021](../../adr/0021-catalog-cards-show-the-blueprint-cover.md)).

The listing is generated with the site, so every visitor gets the same HTML.
Search and category filter in the browser and live in the URL.

## Follow via RSS

`/blueprints/rss.xml` lists every Blueprint, generated with the site. Each entry
carries a title, summary, category, and canonical record link. Entries sort by
`updatedAt` descending, then slug for ties. `pubDate` is the first commit that
touched the Blueprint's directory; `atom:updated` is the latest one.

The GUID is the record URL, because a Blueprint's identity is its slug. The
feed holds current entries only: removing a Blueprint's directory removes its
entry on the next build. Reading RSS does not fetch a Product Report.

## Open a record

`/blueprints/:slug` renders the Blueprint's Product Report into the generated
page. The pull command is the point of the page. Its open section, resource page,
and Scenario route reading live in the query string, so a record view is a
shareable URL and survives refresh.

The report sidebar starts with the current Product's logo and name. Its picker
lists every public Blueprint, with keyboard type-ahead and the current Product marked.
Choosing another Blueprint opens its Overview; browser Back restores the previous
report address. The picker remains available in the collapsed rail and mobile
drawer. All Blueprints sits below the Product choices in the picker, separated
by a divider, and returns to the catalog. Vocabulary stays in the site header,
including the controls for hiding and restoring report tooltips; the report
sidebar does not repeat it.

The portable report carries Product meaning but no repository-local
implementation navigation. Catalog provenance — the `blueprints/<slug>` source path,
commit, and report digest — comes from the release build and is rendered
separately.

## Pull

`pdd-kit blueprint pull <slug>` downloads the Blueprint's Product Report from
the `blueprints-v<major>` GitHub Release and expands it into a local
`product-model/`, including the directory's canonical orientation README. The
site is not involved: it is built from the same release script, so the record
page and the pull show the same report.

## Contribute

A contributor does not write to this site. `pdd-kit blueprint contribute`
opens a pull request against `itai-gendler/pdd-kit`, carrying a regenerated model
with no implementation References, repository-relative targets, or build
artifacts — see
[ADR-0005](../../adr/0005-contribution-prs-carry-a-regenerated-model.md).

Merging the pull request publishes it. CI rebuilds the Blueprint release and
the site; there is no separate listing decision.

## Related

- [System architecture](../architecture/system-architecture.md) — how Blueprints reach the site
- [Catalog screens](../ui/catalog-screens.md)

# Design Documentation

read_when: you need the current shape of the site, or you are about to add a
document and need to know where it goes.

This is the design set for `pdd-kit.dev` — the one site the product ships as.
It records what exists and labels what does not.

Start with [`CONTEXT.md`](../../CONTEXT.md) for the vocabulary. Nothing else here
makes sense without it.

## Map

| Where | Owns |
| --- | --- |
| [`product/`](./product/product-requirements.md) | what the product is for, and what is deliberately not in it |
| [`architecture/`](./architecture/system-architecture.md) | how the site is generated, routed, and where its content comes from |
| [`experiences/`](./experiences/catalog.md) | what each surface lets someone do, and the rules behind it |
| [`ui/`](./ui/README.md) | screens, shared visual patterns, and state coverage |
| [`foundation/`](./foundation/brand-guidelines.md) | palette, typography, assets, voice, and how these documents are written |
| [`phases/`](./phases/README.md) | what has landed, in the order it landed |
| [`plans/`](./plans/README.md) | accepted cross-cutting decisions and their sequencing |
| [`../adr/`](../adr/) | decisions a future reader would otherwise "fix" |
| [`../engineering-standards.md`](../engineering-standards.md) | runtime, dependency, and quality-gate policy |
| [`../analytics.md`](../analytics.md) | PostHog configuration, consent, and events |
| [`../../CONTEXT.md`](../../CONTEXT.md) | the internal glossary |
| [`../adr/0012-public-terminology-lives-with-entities.md`](../adr/0012-public-terminology-lives-with-entities.md) | why public definitions live on their owning PDD docs pages |

### Architecture

- [System architecture](./architecture/system-architecture.md) — one statically generated Nuxt app, and where its content comes from
- [Routing and naming](./architecture/routing-and-naming.md) — the route families, the naming rules, and the retired paths

### Experiences

- [Catalog](./experiences/catalog.md) — browse, pull, contribute
- [Documentation](./experiences/documentation.md) — docs, FAQ, and changelog read from the repository
- [Marketing, writing, and legal](./experiences/marketing.md) — positioning, blog, changelog

## Current state

The site is marketing, documentation, blog, changelog, FAQ, and the public
Blueprint catalog, generated as static files in `site/` of
`itai-gendler/pdd-kit`. Documentation, FAQ, and changelog are read from the
same checkout at build time; Blueprints are built from its `blueprints/` with
the script that publishes the Blueprint GitHub Release `pdd-kit blueprint pull`
reads. The product has not launched publicly.

## Adding a document

1. Read [`foundation/documentation-standard.md`](./foundation/documentation-standard.md).
2. Put it in the directory that owns the subject. If no directory owns it, say so
    in your handoff rather than inventing a tree.
3. Give it a `read_when` hint if anything outside its own area should read it.
4. Link it from this page.

Prefer editing an existing document over adding a neighbour to it. Two documents
that both half-describe a surface are worse than one that describes it fully.

---
domain: blueprint-portability
references:
  - kind: spec
    role: intent
    target: spec/report.md
    title: The Product Report wire contract
  - kind: doc
    role: context
    target: docs/cli-export.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#projectPortableReport
---

# Blueprint

A Product Model as a single portable file: the Product Report that leaves the
repository which authored it. It is what an export writes, what an open reads,
what the Blueprint release serves to a list or a pull, and what a contribution
proposes. Published Blueprints live in the `blueprints/` folder of a GitHub
repository, one Product Model each, and merging a pull request there publishes
one: the repository rebuilds its rolling release, which lists and serves every
Blueprint in that folder. Opening it regenerates
a canonical model that preserves portable product meaning. It carries no
coverage, since coverage describes the authoring repository's code, so the
opened model starts with empty coverage.

## Information kept

- **Schema version** — the report contract it was written under, which a reader refuses rather than migrates
- **Product identity** — name, title, summary, category, tags, authors, and licence, as a published Blueprint is listed
- **Product meaning** — every resource of the model with its relations, Contexts, Scenarios, Steps, and Business Rules

## States

### Exported

A generated file in the model's build location, replaced on every run and ignored by the repository.

### Proposed

Open as a pull request adding it to the `blueprints/` folder of the Blueprint repository under the Product's own identifier. Merging it publishes it, and merging stays with that repository's maintainers.

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
what a catalog serves, and what a contribution proposes. It is regenerated
rather than copied, so the one this repository exports and the one another
repository pulls are byte-identical.

## Information kept

- **Schema version** — the report contract it was written under, which a reader refuses rather than migrates
- **Product identity** — name, summary, category, tags, authors, and licence, as a catalog would list it
- **Product meaning** — every resource of the model with its relations, Contexts, Scenarios, Steps, and Business Rules
- **Coverage** — the model's status, method, unmapped areas, and limitations, without the source areas that only located files

## States

### Exported

A generated file in the model's build location, replaced on every run and ignored by the repository.

### Proposed

Open as a pull request against a catalog's source repository under the Product's own identifier. Merging, publishing, and listing stay with the catalog's maintainers.

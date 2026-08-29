---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/domains.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportDomainSchema
---

# Domain

What makes a Capability list navigable again once it has outgrown a single
screen. Authors add these late, and a model that never needs one is not a poorer
model.

## Information kept

- Its name and the region it covers
- What it explicitly does not own, which is what makes it checkable
- Its colour slot in a rendered report

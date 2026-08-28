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

A coherent region of the Product's subject matter, with its own vocabulary and
invariants. An axis that classifies, never a level that contains.

## Information kept

- Its name and the region it covers
- What it explicitly does not own, which is what makes it checkable
- Its colour slot in a rendered report

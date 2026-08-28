---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/product.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ProductReportV11Schema
---

# Product

The one coherent value promise a Product Model describes. Exactly one per model,
and the thing every other Element is ultimately about.

## Information kept

- Its name, its one-paragraph description, and why it should exist
- The portable identity a catalog needs: summary, category, tags, authors, licence
- What it does not attempt, recorded as limitations

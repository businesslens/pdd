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

The one file a model cannot omit, and the one a reader opens first. Everything
else in the directory is an answer to something it claims.

## Information kept

- Its name, its one-paragraph description, and why it should exist
- The portable identity a catalog needs: summary, category, tags, authors, licence
- What it does not attempt, recorded as limitations

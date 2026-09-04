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
    target: src/core/portable.ts#ProductReportV13Schema
---

# Product

The one file a model cannot omit, and the one a reader opens first. Everything
else in the directory is an answer to something it claims.

## Information kept

- **Identity** — its name, its one-paragraph description, and why it should exist
- **Catalog identity** — the portable facts a catalog needs: summary, category, tags, authors, licence
- **Limitations** — what it does not attempt, recorded so a reader does not have to infer it

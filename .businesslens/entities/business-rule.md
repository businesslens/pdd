---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/business-rules.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportBusinessRuleSchema
---

# Business Rule

A durable constraint that governs two or more behaviours, or a Context
independent of any single one. What must remain true.

## Information kept

- The assertion itself, and why it protects the Product
- Which behaviours it governs, and the Contexts that narrow them
- The reasoning that makes it reviewable

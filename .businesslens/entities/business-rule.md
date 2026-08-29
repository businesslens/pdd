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

What an author reaches for once the same constraint has appeared in Scenario
after Scenario. Writing it in one place, and citing it from none of them, is the
whole point of having it.

## Information kept

- The assertion itself, and why it protects the Product
- Which behaviours it governs, and the Contexts that narrow them
- The reasoning that makes it reviewable

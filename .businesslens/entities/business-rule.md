---
domain: model-authoring
relations:
  - entity: entity
    verb: governs
    cardinality: many-to-many
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
whole point of having it. It is also the only place the model says who may act:
a Scenario shows someone doing a thing, and the Rule says whether they may.

## Information kept

- **Assertion** — what must remain true, and why it protects the Product
- **Reach** — the Capabilities, Contexts, or Entity operations it governs — an operation being a thing, an effect, and the states between
- **Permission** — who may perform a governed operation: named Actors, a relation path from the thing to whoever holds it, the thing itself, an unattended trigger, or nobody at all, and the fact or state condition under which the grant holds
- **Rationale** — the reasoning that makes it reviewable

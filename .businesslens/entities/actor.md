---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/actors.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportActorSchema
---

# Actor

Where authoring a model starts, because no Interface can be written until one
of these exists. It answers the question a reader brings first: who is this
for.

## Information kept

- Whether it is a person or a system, and whether it sits inside or outside the Product boundary
- Its name and what distinguishes its goals from another Actor's
- What the Product keeps about it

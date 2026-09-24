---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/interfaces.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportScreenSchema
---

# Screen

What an author writes when a view is worth naming on its own — and the type they
most often over-author, one file per route, until someone reads the model back
to them.

## Information kept

- **Exposure** — the Capabilities its own Steps use
- **Presents** — the Entities it presents and the facts of each that are on screen
- **Nesting** — the parent it sits in and the Screens nested inside it
- **Addresses** — where it answers, and whether it is reachable from every place in its container

---
domain: model-authoring
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/screens.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportScreenSchema
---

# Screen

A meaningful user-visible view. Platform-neutral: not a route, not a component,
not a viewport.

## Information kept

- The Capabilities it exposes and the Entities it presents
- What information the view shows, and what can be done from it
- The states the view itself can be in
- Its addresses, and what it deliberately does not expose

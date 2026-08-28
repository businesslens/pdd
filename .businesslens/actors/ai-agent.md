---
kind: system
relationship: external
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: Why an agent harness is an Actor
  - kind: doc
    role: context
    target: docs/skills.md
---

# AI agent

A coding-agent harness that loads a BusinessLens skill and acts inside the
repository on the Developer's behalf. It initiates: it chooses what to inspect,
reads source and documentation, runs the structural check, drafts the model
change it believes the evidence supports, and writes only what the Developer has
approved. It is named for the role rather than for any one product that fills it.

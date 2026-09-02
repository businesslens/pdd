---
kind: system
acts: external
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: Why an agent harness is an Entity that acts
  - kind: doc
    role: context
    target: docs/skills.md
---

# AI agent

A coding-agent harness that loads a BusinessLens skill and acts inside the
repository on the Developer's behalf. It initiates: it chooses what to inspect,
reads source and documentation, runs the structural check, and drafts the model
change it believes the evidence supports. It never holds a grant to write
product meaning of its own; what it writes is what the Developer approved. It is
named for the role rather than for any one product that fills it.

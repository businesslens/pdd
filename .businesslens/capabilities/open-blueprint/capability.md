---
domain: blueprint-portability
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/open.ts#expandProductReport
    title: Report expansion
---

# Open a Blueprint

Expands a local Product Report into a canonical Product Model in the chosen
directory, together with its orientation README. The report is parsed,
projected, expanded, and checked in a staging area before the target is touched
at all, and the target needs no Git repository.

## Intent

Receiving a Blueprint should be a single, reversible step that either produces a
sound model or produces nothing. What lands is what a pull from a catalog would
have produced, so the two paths cannot drift apart.

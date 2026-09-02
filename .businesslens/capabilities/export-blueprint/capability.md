---
domain: blueprint-portability
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/export.ts#compileReport
    title: Model to report compilation
  - kind: code
    role: implementation
    target: src/core/portable.ts#projectPortableReport
    title: The portable projection
---

# Export a Blueprint

Compiles the current Product Model into a single portable Product Report — a
Blueprint — and writes it as a generated file the repository ignores. The report
carries product meaning, relationships, Contexts, Scenarios with what each Step
does, Rules with who may act, and coverage, and drops everything that only
navigated the repository it came from.

## Intent

A Product Model should be able to leave the repository that authored it without
carrying source paths, code references, or a claim about how it was derived. A
Blueprint is a contract someone else can start from, not a copy of this
repository's file tree.

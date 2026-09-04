---
appliesTo:
  - type: capability
    id: map-established-behavior
  - type: capability
    id: decide-intended-behavior
  - type: capability
    id: verify-model-alignment
  - type: capability
    id: open-blueprint
  - type: capability
    id: pull-blueprint
references:
  - kind: doc
    role: intent
    target: AGENTS.md
    title: Installer standards
---

# Model writes stay inside the model directory

Anything that writes product meaning writes only inside `.businesslens/`, with
one exception the Developer asks for by name: opening or pulling a Blueprint
with `--force` over an existing model first moves that model to a timestamped
`.businesslens.backup-<timestamp>/` sibling. The backup is a sibling of the
directory it copies, requested explicitly, and never a shared file other tools
also manage. The repository's own `AGENTS.md`, `CLAUDE.md`, and root README are
left byte for byte as they were, and no managed block is added to a file the
repository owns.

## Rationale

Every tool wants to write to the repository's instruction files, and managed
blocks there get reordered by formatters, duplicated, and merge-conflicted. A
README describing the directory it sits in is also correct whether or not the
repository has an implementation, which a block making claims about the whole
repository never was.

---
appliesTo:
  - type: entity
    id: product-model
    effect: changes
    contexts:
      - place: local-report-web
permits: []
references:
  - kind: doc
    role: intent
    target: AGENTS.md
    title: Report viewer standards
---

# The report never edits the model

Nothing reachable from the local Product Report changes the Product Model. The
report is a reading of files the Developer edits elsewhere; it presents them,
recompiles when they change, and offers no control that would write one.

## Rationale

The files are the contract, already addressable and already complete, and a
second editing surface would put two authors on one file with only one of them
in Git's history. Closing the operation to everyone, in that one place, says so
in a form the structural check enforces on every Scenario that reaches the
report.

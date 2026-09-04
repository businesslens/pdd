---
appliesTo:
  - type: entity
    id: blueprint
references:
  - kind: spec
    role: intent
    target: spec/report.md
    title: The Product Report wire contract
  - kind: code
    role: implementation
    target: src/core/portable.ts#projectPortableReport
---

# Blueprints carry no source navigation

A Blueprint carries product meaning and nothing that only navigated the
repository it came from: no code references, no implementation-role references,
no repository-relative targets, no repository entry points, and no source areas.
It also carries no claim about how it was derived, because a Blueprint's origin
is not part of its contract. This holds wherever a Blueprint is written or read.

## Rationale

Navigation that resolves in one repository is at best noise and at worst
misleading in another, and a reader receiving a Blueprint has no way to tell
which. Applying the same projection everywhere a Blueprint is produced or
consumed is also what makes an exported, pulled, and contributed model
byte-identical.

---
appliesTo:
  - type: capability
    id: export-blueprint
  - type: capability
    id: open-blueprint
  - type: capability
    id: pull-blueprint
  - type: capability
    id: contribute-blueprint
---

# Blueprints carry no source navigation

A Blueprint carries product meaning and nothing that only navigated the
repository it came from: no code references, no implementation-role references,
no repository-relative targets, no repository entry points, and no source areas.
It also carries no claim about how it was derived, because a Blueprint's origin
is not part of its contract.

## Rationale

Navigation that resolves in one repository is at best noise and at worst
misleading in another, and a reader receiving a Blueprint has no way to tell
which. Applying the same projection everywhere a Blueprint is produced or
consumed is also what makes an exported, pulled, and contributed model
byte-identical.

---
appliesTo:
  - type: entity
    id: notebook
    facts: [Name]
---

# Notebook names are unique

No two of an Owner's notebooks share a name, ignoring capital letters, whether
the name is given when the notebook is created or when it is renamed.

## Rationale

The Owner files and moves notes by picking a notebook's name, so a name must
identify exactly one notebook.

---
appliesTo:
  - { type: entity, id: duplicate-suggestion, effect: changes }
permits:
  - related: [{ verb: groups, entity: bookmark }, { verb: owns, entity: owner }]
---

# Only the Owner decides a duplicate suggestion

A duplicate suggestion is accepted, with the bookmark it keeps, or dismissed
only by the Owner whose bookmarks it groups. The AI agent cannot accept its own
suggestion, change one after leaving it, or take one back.

## Rationale

A merge deletes bookmarks. Only the Owner who kept them may decide that they
were the same page.

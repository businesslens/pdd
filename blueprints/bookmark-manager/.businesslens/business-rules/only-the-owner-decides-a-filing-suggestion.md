---
appliesTo:
  - { type: entity, id: filing-suggestion, effect: changes }
permits:
  - related: [{ verb: covers, entity: bookmark }, { verb: owns, entity: owner }]
---

# Only the Owner decides a filing suggestion

A filing suggestion is accepted or dismissed only by the Owner whose bookmarks
it covers. The AI agent cannot accept its own suggestion, change one after
leaving it, or take one back.

## Rationale

The approval is the point of a suggestion. A suggestion its author could decide
would be a change made on the Owner's behalf without asking.

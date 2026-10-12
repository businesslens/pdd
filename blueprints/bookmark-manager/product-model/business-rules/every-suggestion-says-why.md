---
appliesTo:
  - { type: entity, id: filing-suggestion, facts: [Reason] }
  - { type: entity, id: duplicate-suggestion, facts: [Reason] }
---

# Every suggestion says why

Each suggestion an AI agent leaves carries a short reason the Owner sees beside
the bookmarks it names: what the bookmarks have in common, or why they are the
same page. A suggestion without a reason is refused.

## Rationale

The Owner decides from what they can see. A reason lets them accept or dismiss
in a moment, and makes a wrong suggestion recognizably wrong.

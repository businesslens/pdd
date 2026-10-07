---
appliesTo:
  - type: entity
    id: page
    effect: creates
  - type: entity
    id: page
    effect: changes
    facts: [Title, Content]
---

# Every change to a page's title or content adds a revision

Each save of a page's title or content — creating it, editing it, restoring an
earlier revision, or accepting a suggestion — adds a revision naming who saved
it, when, and how it came about. No revision is ever changed, so restoring is
itself a new revision.

## Rationale

The history is how a team trusts a page: it must say truthfully what the page
said and who changed it, including after a restore.

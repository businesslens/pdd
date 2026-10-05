---
appliesTo:
  - type: capability
    id: create-page
  - type: capability
    id: edit-page
  - type: capability
    id: restore-revision
  - type: capability
    id: publish-suggestion
---

# Every change to a page's title or content adds a revision

Each save of a page's title or content — creating it, editing it, restoring an
earlier revision, or publishing a suggestion — adds a revision naming who saved
it, when, and how it came about. No revision is ever changed or removed, so
restoring is itself a new revision.

## Rationale

The history is how a team trusts a page: it must say truthfully what the page
said and who changed it, including after a restore.

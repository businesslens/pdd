---
domains:
  - accounts
  - library
  - sharing
capabilities:
  - collection-sharing
  - reading-state
---

# Reading state belongs to one reader

What has been read, when, and how far is visible only to the reader it belongs
to, and is never exposed by sharing a collection or by any other reader's
actions.

## Intent

Sharing curation must never leak consumption. A reader publishing a collection is
offering a set of items, not a record of their own reading habits.

## Rationale

Reading state is the most personal thing in the library and the easiest to leak
accidentally, because collections are built out of the same items reading state
attaches to. Keeping the two strictly separate means a published collection can
be rendered for a stranger without filtering anything out.

---
domain: notes
relations:
  - entity: suggestion
    verb: receives
    cardinality: one-to-many
---

# Note

A piece of writing the owner keeps: a thought captured in a few seconds, or a
longer page worked on over time.

## Information kept

- **Title** — what the note is called; its first line when the owner gives it no title
- **Body** — what the note says
- **Notebook** — the notebook it is filed in, if any
- **Tags** — the tags the owner has put on it
- **Linked notes** — the other notes it links to
- **Created at** — when it was captured
- **Last edited** — when its title or body last changed

## States

### Unsorted

In the inbox: captured, and not filed in any notebook yet.

### Filed

In exactly one notebook, and no longer in the inbox.

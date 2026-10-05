---
domain: suggestions
relations:
  - entity: bookmark
    verb: covers
    cardinality: many-to-many
---

# Filing suggestion

An AI agent's proposal to file one or more bookmarks into a collection,
existing or new, and to add tags to them.

## Information kept

- **Collection** — the existing collection, or the name of a new one, it would file the bookmarks in
- **Tags to add** — the tags it would add to each of the bookmarks, if any
- **Reason** — the agent's short explanation of why the bookmarks belong there

## States

### Pending

Waiting for the Owner to decide. Nothing in the library has changed.

### Accepted

The Owner accepted it, and its bookmarks were filed and tagged as it said.

### Declined

The Owner declined it. Nothing changed, and the same suggestion cannot be left
again.

### Withdrawn

Every bookmark it covered was deleted before the Owner decided, so nothing is
left to file.

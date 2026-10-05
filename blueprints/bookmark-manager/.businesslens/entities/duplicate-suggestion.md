---
domain: suggestions
relations:
  - entity: bookmark
    verb: groups
    cardinality: many-to-many
---

# Duplicate suggestion

An AI agent's proposal that two or more bookmarks lead to the same page and
should be merged into one.

## Information kept

- **Shared page** — the page every bookmark in it leads to, however each address is written
- **Kept bookmark** — the bookmark a merge keeps: the agent's choice until the Owner picks another
- **Reason** — the agent's short explanation of why the bookmarks are the same page

## States

### Pending

Waiting for the Owner to decide. Every bookmark in it is still in the library.

### Merged

The Owner merged it: the kept bookmark carries the others' tags and notes, and
the others are gone.

### Declined

The Owner declined it. Every bookmark stays, and the same set cannot be
suggested again.

### Withdrawn

All but one of its bookmarks were deleted before the Owner decided, so nothing
is left to merge.

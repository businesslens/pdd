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

### Proposed

Waiting for the Owner to decide. Every bookmark in it is still in the library.

### Accepted

The Owner accepted it, and its bookmarks were merged: the kept bookmark
carries the others' tags and notes, and the others are gone.

### Dismissed

The Owner dismissed it. Every bookmark stays, and the same set cannot be
suggested again.

### Outdated

All but one of its bookmarks were deleted before the Owner decided, so the
Product closed it with nothing left to merge.

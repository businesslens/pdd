---
relations:
  - entity: source
    verb: comes from
    cardinality: one
transitions:
  - from: Unread
    to: Read
    by: track-reading-state
  - from: Read
    to: Unread
    by: track-reading-state
domain: reading
---

# Item

One piece of content a Reader can read, from a followed source or an address
they saved directly.

## Information kept

- Its title
- When it was published
- Whether the Reader has read it
- When the Reader saved it, if they did

## States

### Unread

Waiting in the Reader's backlog, counted against what is left to read.

### Read

Marked as read, and no longer counted against the backlog.

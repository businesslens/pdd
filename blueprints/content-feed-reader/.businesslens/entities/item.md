---
domain: reading
---

# Item

One piece of content a Reader can read, from a followed source or an address
they saved directly.

## Information kept

- Its title and the source it came from
- When it was published
- Whether the Reader has read it
- When the Reader saved it, if they did

## States

### Unread

Waiting in the Reader's backlog, counted against what is left to read.

### Read

Marked as read, and no longer counted against the backlog.

## Transitions

- Unread → Read by track-reading-state
- Read → Unread by track-reading-state

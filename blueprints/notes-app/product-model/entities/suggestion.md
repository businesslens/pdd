---
domain: suggestions
---

# Suggestion

What an AI agent proposes for one note: a notebook to file it in, tags to put
on it, other notes to link it to, or any of these together, with the reason for
proposing it. It waits for the owner, who accepts or dismisses it whole.

## Information kept

- **Suggested notebook** — an existing notebook to file the note in, if any
- **Suggested tags** — tags to put on the note, existing or new, if any
- **Suggested links** — other notes to link the note to, if any
- **Reason** — why the agent suggests it, in a sentence the owner can judge
- **Suggested at** — when the agent left it

## States

### Proposed

Waiting for the owner. The note is exactly as it was.

### Accepted

The owner accepted it, and what it proposed was applied to the note as the
owner's own change.

### Dismissed

The owner dismissed it. The note is exactly as it was.

---
domain: proposals
---

# Proposed card

A card an AI agent suggests for a board, waiting for a member to accept or
dismiss it. It is not on the board until a member accepts it.

## Information kept

- **Title** — the work the agent suggests
- **Description** — what the agent expects the work to involve
- **Reason** — the goal a member stated, or the stalled card it is the next step for
- **Suggested column** — the column the agent suggests the card start in

## States

### Proposed

Waiting for a member's decision among the board's proposed cards.

### Accepted

A member accepted it, and a card made from it is on the board.

### Dismissed

A member dismissed it. Nothing was added to the board.

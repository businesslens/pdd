---
domain: proposals
---

# Proposed card

A card the AI agent suggests for a board, waiting for a member to accept or
dismiss it. It is not on the board, and nothing on the board changes until a
member accepts it.

## Information kept

- **Title** — the work the agent suggests
- **Description** — what the agent expects the work to involve
- **Goal** — the goal the member stated that the proposal serves
- **Suggested column** — the column the agent suggests the card start in

## States

### Pending

Waiting for a member's decision among the board's proposed cards.

### Accepted

A member accepted it, and a card made from it is on the board.

### Dismissed

A member dismissed it. Nothing was added to the board.

---
domain: cards
availability: [{ place: agent-tools }]
---

# Flag stalled card

Raises a stall flag on a card that has stayed in one column, other than the
board's last, longer than the board's stall threshold. The AI agent decides
when to look; the Product checks every flag against the threshold before it is
raised.

## Intent

Make work that has quietly stopped visible to the team without changing the
card or deciding what should happen to it.

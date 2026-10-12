---
domain: cards
availability: [{ place: board-web }]
---

# Stalled card flagging

The Product raises a stall flag on a card that has stayed in one column, other
than the board's last, longer than the board's stall threshold. It checks every
board on its own schedule, whether or not anyone is looking.

## Intent

Make work that has quietly stopped visible to the team without changing the
card or deciding what should happen to it.

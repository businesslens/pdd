---
appliesTo:
  - type: entity
    id: card
    effect: changes
    facts: [Due on, Interval]
---

# A card's rating decides when it comes back

Each rating sets the card's gap, and the card is due again that many days after
it was rated:

- **Again** — the gap restarts at one day, the card is learning, and it is asked
  once more before the session ends.
- **Hard** — the gap grows by a fifth; a new card's first gap is one day.
- **Good** — the gap grows two and a half times; a new card's first gap is one
  day.
- **Easy** — the gap grows four times; a new card's first gap is four days.

A gap is never shorter than one day. A card whose gap reaches 21 days or more
is known; below that it is learning.

## Rationale

Cards that were hard to recall come back soon and easy ones stay away longer,
so study time goes where forgetting is closest.

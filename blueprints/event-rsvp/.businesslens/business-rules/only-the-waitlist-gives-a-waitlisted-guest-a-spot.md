---
appliesTo:
  - type: entity
    id: guest
    effect: changes
    from: Waitlisted
    to: Going
permits:
  - unattended: true
---

# Only the waitlist gives a waitlisted guest a spot

A waitlisted Guest becomes going only when the Product moves them as spots
open: the earliest waitlisted party that fits the open spots goes first. No
guest moves themselves ahead, and the Host does not pick who gets in.

## Rationale

People on a waitlist accept waiting because the order is fair and visible.
Moving someone by hand would break that promise for everyone behind them.

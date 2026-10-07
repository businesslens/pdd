---
appliesTo:
  - type: entity
    id: card
    facts: [Due date]
---

# A card is overdue once its due date passes outside the last column

A card whose due date has passed is shown as overdue wherever its due date is
shown, until it reaches its board's last column. A card in the last column is
never overdue.

## Rationale

The last column is where finished work rests, so a due date only signals risk
while the work is still under way.

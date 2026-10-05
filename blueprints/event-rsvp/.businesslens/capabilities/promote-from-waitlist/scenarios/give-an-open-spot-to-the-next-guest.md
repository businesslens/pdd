---
kind: primary
routes:
  web: Web
steps:
  - text: Spots open on a scheduled event that has waitlisted guests
    kind: condition
    unattended: true
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: event, effect: reads, facts: [Spots left] }
  - text: The Product moves the earliest waitlisted Guest whose party fits the open spots to going
    kind: product
    entities:
      - { entity: guest, from: Waitlisted, to: Going, facts: [] }
  - text: The Product emails the Guest that they have a spot, with their personal link
    kind: product
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
  - text: The guest list on the event shows the Guest as going
    kind: product
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Guest's personal link shows them as going
    kind: product
    entities:
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Give an open spot to the next guest

## Trigger

A going Guest changes their answer, or the Host raises the capacity, while
guests are waiting.

## Outcome

The waitlisted Guest who answered earliest and fits is going and has been told;
the Host's guest list and the Guest's personal link both show it.

## Edge cases

- Several spots open at once → the Product repeats the move, in order, while a waitlisted party still fits.
- The earliest waitlisted party does not fit the open spots → the next party that fits moves ahead of it, and the earlier party keeps its place.
- No waitlisted party fits → nobody moves and the spots stay open for the next answer.
- The event has started or is cancelled → nobody moves.

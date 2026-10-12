---
kind: edge
routes:
  web: Web
steps:
  - text: The Guest opens the invitation link of an event
    kind: actor
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [Title] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event is cancelled
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product says the event is cancelled, takes no answer and shows no online link
    kind: product
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Open the invitation of a cancelled event

## Trigger

Someone opens an invitation link after its Host cancelled the event.

## Outcome

The Guest learns the event is not happening and cannot answer it.

---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest opens the personal link from their confirmation email
    kind: actor
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product shows the event with the Guest's own answer and plus-one
    kind: product
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [Title, Starts at, Ends at, Place] }
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: For an online event, the Product shows the Guest where to join
    kind: product
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [Online link] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Open your own answer

## Trigger

A Guest who has answered comes back through the personal link the Product
emailed them.

## Outcome

The Guest sees the event, their own answer and plus-one, and where to join if
it is online, and can change their answer from there.

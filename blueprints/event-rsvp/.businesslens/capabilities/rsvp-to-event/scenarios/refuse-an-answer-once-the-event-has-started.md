---
kind: validation
routes:
  web: Web
steps:
  - text: The Guest chooses an answer on the invitation
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event has already started
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Starts at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product says answers are closed and records nothing
    kind: product
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Refuse an answer once the event has started

## Trigger

Someone tries to answer an invitation after the event's start time.

## Outcome

No answer is recorded and the Guest knows answers are closed. The guest list is
unchanged.

## Edge cases

- The Guest tries to change their RSVP through its personal link → it is refused the same way and the RSVP stays as it was.

---
kind: primary
routes:
  web: Web
steps:
  - text: The Host cancels a scheduled event, optionally writing a note, and confirms
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product cancels the event
    kind: product
    actor: host
    entities:
      - { entity: event, from: Scheduled, to: Cancelled, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product emails every guest who is going, maybe or waitlisted that the event is cancelled, with the Host's note
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [Email] }
---

# Cancel an event

## Trigger

The Host calls off an event that is still scheduled.

## Outcome

The event is cancelled, the guests who might have come have been told, and the
invitation says it is cancelled and takes no answers. The guest list stays for
the Host to read.

## Edge cases

- The Host leaves before confirming → the event stays scheduled and nobody is emailed.
- Nobody has answered yet → the event is cancelled and nobody is emailed.

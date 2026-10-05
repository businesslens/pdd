---
kind: primary
routes:
  web: Web
steps:
  - text: The Host changes the start and end of a scheduled event
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Starts at, Ends at] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product saves the new time on the event
    kind: product
    actor: host
    entities:
      - { entity: event, facts: [Starts at, Ends at] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product emails every guest who is going, maybe or waitlisted about the new time
    kind: product
    actor: host
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
---

# Change the time of an event

## Trigger

The Host moves a scheduled event to a new time.

## Outcome

The event shows its new time, the guests who might come have been told, and
every guest's answer is unchanged.

## Edge cases

- The place or online link changes → the same guests are told the same way.
- Only the title or description changes → no guest is emailed.

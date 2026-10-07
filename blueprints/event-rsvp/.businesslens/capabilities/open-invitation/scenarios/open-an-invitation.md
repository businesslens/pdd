---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest opens the invitation link of a scheduled event
    kind: actor
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [Title, Description, Starts at, Ends at, Place, Spots left] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product shows the event's details, its Host and the spots left, and nothing about other guests
    kind: product
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [Title, Description, Starts at, Ends at, Place, Plus-ones allowed, Spots left] }
      - { entity: host, effect: reads, facts: [Name] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Open an invitation

## Trigger

Someone opens the invitation link a Host shared.

## Outcome

The Guest knows what the event is, when and where it happens, who is hosting
and whether there is room, and can answer.

## Edge cases

- The event is held online → the invitation says so without showing where to join.
- The event has no capacity → no spot count is shown.

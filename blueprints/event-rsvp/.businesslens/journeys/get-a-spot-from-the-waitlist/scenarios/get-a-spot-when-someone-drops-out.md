---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Guest says yes to a full event and joins the waitlist
    kind: actor
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
      - { entity: guest, effect: creates, to: Waitlisted, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: A spot opens on the event before it starts
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
  - text: Waitlist promotion gives the open spot to the Guest
    kind: product
    capability: promote-from-waitlist
    entities:
      - { entity: guest, effect: reads, facts: [] }
  - text: The Product emails the Guest that they have a spot, with their personal link
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
  - text: The Guest follows the personal link and sees they are going, with the event's details
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
      - { entity: event, effect: reads, facts: [Title, Starts at, Place] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Get a spot when someone drops out

## Trigger

A Guest joins the waitlist of a full event, and a going guest later changes
their answer.

## Outcome

The Journey goal is achieved: the Guest is going, was told by email, and sees
the event's details through their personal link.

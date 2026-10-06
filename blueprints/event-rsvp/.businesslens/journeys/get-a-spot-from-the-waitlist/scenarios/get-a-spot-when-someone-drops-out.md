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
      - { entity: rsvp, effect: creates, to: Waitlisted, facts: [Name, Email, Plus-one, Responded at, Personal link] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: A spot opens on the event before it starts
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
  - text: Waitlist promotion moves the Guest's RSVP to going
    kind: product
    capability: promote-from-waitlist
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [] }
  - text: The Product emails the Guest that they have a spot, with the personal link to their RSVP
    kind: product
    capability: promote-from-waitlist
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [Personal link] }
  - text: The Guest follows the personal link and sees they are going, with the event's details
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
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

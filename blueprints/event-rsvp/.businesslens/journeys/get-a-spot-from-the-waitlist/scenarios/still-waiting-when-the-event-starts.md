---
kind: edge
result: not-achieved
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
  - text: No spot opens on the event before it starts
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Starts at] }
  - text: The Guest follows the personal link and sees they are still waitlisted and answers are closed
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Still waiting when the event starts

## Trigger

A Guest joins the waitlist of a full event and no going guest gives up a spot.

## Outcome

The Journey goal is not achieved: the Guest never got a spot, and their
personal link says so plainly once answers have closed.

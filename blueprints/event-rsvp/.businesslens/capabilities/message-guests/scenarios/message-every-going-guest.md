---
kind: primary
routes:
  web: Web
steps:
  - text: The Host chooses to write to an event's guests
    kind: actor
    actor: host
    entities:
      - { entity: rsvp, effect: reads, facts: [] }
      - { entity: event, effect: reads, facts: [Title] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Host chooses the going answer as recipients and writes a subject and body
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product shows how many guests the chosen answers reach
    kind: product
    actor: host
    entities:
      - { entity: rsvp, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Host sends it
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product emails each guest who is going and keeps the message on the event
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: message, effect: creates, facts: [Subject, Body, Recipients, Sent at] }
      - { entity: rsvp, effect: reads, facts: [Email] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The message is listed among the event's sent messages
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: message, effect: reads, facts: [Subject, Recipients, Sent at] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Message every going guest

## Trigger

The Host has something to tell the people coming to their event.

## Outcome

Every guest who is going has the Host's email, and the event keeps the message
with whom it went to and when.

## Edge cases

- The email to one guest cannot be delivered → the others still receive it and the message is kept.
- The Host leaves before sending → nothing is sent or kept.

---
kind: edge
routes:
  web: Web
steps:
  - text: The Host chooses which answers on an event to write to and asks for suggested wording
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The language model does not answer
    kind: condition
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product says suggested wording is unavailable right now and leaves the subject and body as the Host had them
    kind: product
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Host writes the subject and body themselves and sends it
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product emails each chosen guest and keeps the message on the event
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: message, effect: creates, facts: [Subject, Body, Recipients, Sent at] }
      - { entity: rsvp, effect: reads, facts: [Email] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
---

# Message while the language model is unavailable

## Trigger

The Host asks for suggested wording while the language model cannot be
reached.

## Outcome

The Host knows no suggestion is coming, loses nothing they had written, and
sends the message in their own words as usual.

---
kind: validation
routes:
  web: Web
steps:
  - text: The Host chooses recipients, writes to them and sends it
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: No guest of the event holds any of the chosen answers
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product refuses to send, says nobody would receive it, and keeps the draft
    kind: product
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
---

# Refuse a message nobody would receive

## Trigger

The Host sends a message to answers no guest currently holds.

## Outcome

Nothing is sent or kept, the Host knows why, and their draft is still there to
send to other recipients.

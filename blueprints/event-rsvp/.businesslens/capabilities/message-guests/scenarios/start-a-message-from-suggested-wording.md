---
kind: primary
routes:
  web: Web
steps:
  - text: The Host chooses which answers on an event to write to and asks for suggested wording
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Product prepares a suggested subject and body from the event's details, without sending anything
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title, Description, Starts at, Ends at, Place, Online link] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Host edits the suggested subject and body
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-message } }
  - text: The Host sends it
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
      - { entity: guest, effect: reads, facts: [Email] }
    contexts: { web: { place: rsvp-web::hosting::new-message } }
---

# Start a message from suggested wording

## Trigger

The Host wants help putting a message to their guests into words.

## Outcome

The chosen guests receive the message as the Host edited and sent it. The
suggestion itself was never sent, and only the sent message is kept.

## Edge cases

- Suggested wording cannot be prepared → the Product says so and the Host writes the message themselves.
- The Host asks again → the Product replaces the unsent suggestion with a new one.
- The Host leaves without sending → nothing is sent or kept.

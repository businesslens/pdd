---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator writes rough notes on what has changed and asks for a draft
    kind: actor
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Drafting assistant drafts a message from the notes and the incident
    kind: actor
    actor: drafting-assistant
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact, Affected components] }
      - { entity: incident-update, effect: creates, to: Draft, facts: [Message, Notes] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product shows the draft beside the notes, marked as a draft
    kind: product
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [Message, Notes] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator edits the drafted message
    kind: actor
    actor: operator
    entities:
      - { entity: incident-update, facts: [Message] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: Nothing is posted and no subscription is emailed
    kind: condition
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [] }
      - { entity: subscription, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Draft an update from notes

## Trigger

The Operator wants help writing the next update for an unresolved incident.

## Outcome

A draft the Operator has edited waits in the incident's workspace; the public page and subscribers are unchanged until the Operator posts it.

## Edge cases

- The Operator asks for another draft → the new draft replaces the old one, which was never posted.
- The Operator throws the draft away → it is gone, and nothing was posted.

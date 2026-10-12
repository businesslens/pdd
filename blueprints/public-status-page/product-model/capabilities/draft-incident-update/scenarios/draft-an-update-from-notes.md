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
  - text: The Product asks a language model to draft a message from the notes and the incident
    kind: product
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact, Affected components] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product fills the message of the update being written with the draft, beside the notes
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator edits the drafted message
    kind: actor
    actor: operator
    entities: []
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

The update being written holds a drafted message the Operator has edited; the public page and subscribers are unchanged until the Operator posts it.

## Edge cases

- The Operator asks for another draft → the new draft replaces the message being written.
- The Operator leaves the workspace without posting → the drafted message is not kept.

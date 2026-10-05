---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner turns assistant access off
    kind: actor
    actor: owner
    entities:
      - { entity: owner, facts: [Assistant access] }
    contexts:
      web:
        place: notes-web::assistant-settings
  - text: Further requests through the agent connection are refused, and suggestions already left stay pending for the Owner to decide
    kind: condition
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::assistant-settings
---

# Stop allowing an AI agent

## Trigger

The Owner no longer wants an AI agent reading their notes.

## Outcome

Assistant access is off: no AI agent can read a note or leave a suggestion, and
the suggestions already waiting can still be accepted or dismissed.

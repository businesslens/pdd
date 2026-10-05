---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to turn assistant access on
    kind: actor
    actor: owner
    entities:
      - { entity: owner, effect: reads, facts: [Assistant access] }
    contexts:
      web:
        place: notes-web::assistant-settings
  - text: The Product explains that a connected agent will be able to read every note and leave suggestions, but never change a note
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::assistant-settings
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities:
      - { entity: owner, facts: [Assistant access] }
    contexts:
      web:
        place: notes-web::assistant-settings
---

# Allow an AI agent

## Trigger

The Owner wants help sorting their notes from an AI agent they connected.

## Outcome

Assistant access is on, and the AI agent can read the Owner's notes and leave
suggestions for them to decide.

## Edge cases

- The Owner declines to confirm → assistant access stays off.

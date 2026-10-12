---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner turns reflections off
    kind: actor
    actor: owner
    entities:
      - { entity: owner, facts: [Reflections] }
    contexts: { web: { place: tracker-web::reflections } }
  - text: No further weekly reflection is prepared, and those already prepared stay readable
    kind: condition
    actor: owner
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week] }
    contexts: { web: { place: tracker-web::reflections } }
---

# Turn off reflections

## Trigger

The Owner no longer wants a weekly look back.

## Outcome

The Product stops preparing reflections and stops reading the Owner's week on
its own; earlier reflections remain.

## Edge cases

- A suggested adjustment is still waiting → it can still be accepted or dismissed.

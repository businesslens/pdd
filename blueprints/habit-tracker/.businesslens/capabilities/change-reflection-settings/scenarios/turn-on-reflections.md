---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to turn reflections on
    kind: actor
    actor: owner
    entities:
      - { entity: owner, effect: reads, facts: [Reflections] }
    contexts: { web: { place: tracker-web::reflections } }
  - text: The Product explains that each week it will read the week back, write a summary with a language model, and may suggest one schedule change that waits for the Owner
    kind: product
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::reflections } }
  - text: The Owner confirms, and the Product records the choice
    kind: actor
    actor: owner
    entities:
      - { entity: owner, facts: [Reflections] }
    contexts: { web: { place: tracker-web::reflections } }
  - text: A weekly reflection will be prepared when the current week ends
    kind: condition
    actor: owner
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::reflections } }
---

# Turn on reflections

## Trigger

The Owner wants a look back at each week.

## Outcome

Reflections are on, and the Owner knew what it reads and that it
changes no habit by itself before agreeing.

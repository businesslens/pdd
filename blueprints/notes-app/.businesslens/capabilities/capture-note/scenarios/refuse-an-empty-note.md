---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner chooses to keep what they wrote before writing a title or any words
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
  - text: The Product finds nothing to keep and creates nothing
    kind: product
    entities: []
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
  - text: The inbox is as it was
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
---

# Refuse an empty note

## Trigger

The Owner keeps a note before writing anything in it.

## Outcome

No note is created and the inbox holds the same notes as before.

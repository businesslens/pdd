---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader picks a source from the list
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [Name, Last read] }
    contexts:
      web:
        place: reader-web::personal-library::source-list
  - text: The Product presents the source's name, the address its feed is read from, and when it was last read successfully
    kind: product
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [Name, Feed address, Last read] }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
  - text: The source's items and their reading state are untouched
    kind: condition
    entities:
      - { entity: source, effect: reads, facts: [] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
---

# Check when a source was last read

## Trigger

The Reader wants to know where a followed source is read from and whether it
is still being read.

## Outcome

The Reader sees the source's feed address and its last successful read, and
nothing about the source or its items has changed.

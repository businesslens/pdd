---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner picks one of their tags
    kind: actor
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::search
  - text: The Product keeps only the notes that carry the tag, with any words entered still applied
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Body, Notebook, Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::search
  - text: The Owner clears the tag and sees every match again
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::search
---

# Narrow a search to a tag

## Trigger

The Owner wants only the notes they grouped under one tag.

## Outcome

The Owner sees exactly the notes carrying the tag that match their words, or
every note carrying it when no words were entered.

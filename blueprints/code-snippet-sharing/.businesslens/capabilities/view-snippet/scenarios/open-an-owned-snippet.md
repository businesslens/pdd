---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer opens a snippet from their list
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
  - text: The Product presents the snippet's details and highlighted code, with its visibility, its address and its history
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Language, Tags, Code, Address, Forked from] }
      - { entity: revision, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Open an owned snippet

## Trigger

The Developer wants to look at, pass on or change one of their snippets.

## Outcome

The Developer sees the snippet as others would, plus who can read it and the
address to pass on, with editing, sharing and deleting at hand.

---
kind: edge
routes:
  web: Web
steps:
  - text: The Visitor opens the address of a snippet that is private or has been deleted
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Product shows that no snippet is found there, the same whether it is private or gone
    kind: product
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
---

# Open a snippet that is not shared

## Trigger

Someone opens an address whose snippet is private, or that its owner deleted.

## Outcome

They see that nothing is found and learn nothing about the snippet, not even
whether it exists.

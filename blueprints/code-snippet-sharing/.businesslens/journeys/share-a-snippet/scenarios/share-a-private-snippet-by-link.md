---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Developer shares a private snippet they own by link
    kind: actor
    actor: developer
    capability: change-snippet-visibility
    entities:
      - { entity: snippet, effect: changes, from: Private, to: Unlisted, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product shows the address to pass on
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Visitor opens the address and reads the snippet's code
    kind: actor
    actor: visitor
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Code] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
---

# Share a private snippet by link

## Trigger

The Developer wants one colleague to read a snippet they keep private, without
putting it out for everyone.

## Outcome

The Journey goal is achieved: the colleague reads the snippet through its
address, and the snippet appears in neither Discover nor search.

---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Developer shares a private snippet they own by link and passes the address on
    kind: actor
    actor: developer
    capability: change-snippet-visibility
    entities:
      - { entity: snippet, effect: changes, from: Private, to: Unlisted, facts: [Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer makes the snippet private again
    kind: actor
    actor: developer
    capability: change-snippet-visibility
    entities:
      - { entity: snippet, effect: changes, from: Unlisted, to: Private, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Visitor opens the address
    kind: actor
    actor: visitor
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Product shows that no snippet is found there
    kind: product
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
---

# Share a link, then make the snippet private

## Trigger

The Developer passes on a snippet's address and makes the snippet private
before the Visitor opens it.

## Outcome

The Journey goal is not achieved: the Visitor cannot read the snippet. Making it
private stays authoritative over an address already handed out, and the Visitor
learns nothing about the snippet.

---
kind: edge
routes:
  web: Web
steps:
  - text: The Developer sets the visibility of a public snippet they own to Private
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product explains that the address will stop showing the snippet to anyone else, that it will leave Discover, and that forks already made stay with their owners
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer confirms
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: changes, from: Public, to: Private, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Make a shared snippet private

## Trigger

The owner wants to stop others reading a snippet they made public.

## Outcome

Only the owner can read the snippet; its address shows nothing to anyone else
and it is gone from Discover. Forks made while it was public are untouched.

## Edge cases

- The snippet is unlisted rather than public → it becomes private the same way, and the address passed on stops working.

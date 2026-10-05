---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer chooses to delete a snippet they own
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product asks the Developer to confirm, and says the snippet and every revision will be gone, its address will show nothing, and forks of it will stay with their owners
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer confirms
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: removes, from: Public }
      - { entity: revision, effect: removes }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product returns to the Developer's list, which no longer holds the snippet
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
---

# Delete an owned snippet

## Trigger

The owner no longer wants a snippet to exist.

## Outcome

The snippet and its history are gone and its address shows nothing to anyone.
Forks other Developers made keep their code, and show that the snippet they came
from is no longer available.

## Edge cases

- The snippet is private or unlisted → it is deleted the same way.
- The Developer declines to confirm → the snippet and its history are unchanged.

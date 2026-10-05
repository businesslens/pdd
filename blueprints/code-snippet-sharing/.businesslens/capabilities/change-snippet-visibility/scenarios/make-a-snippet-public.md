---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer chooses to make a private snippet they own public
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product explains that anyone will be able to read the snippet, find it in Discover and fork it
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
      - { entity: snippet, effect: changes, from: Private, to: Public, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Make a snippet public

## Trigger

The owner wants anyone to be able to find and reuse a snippet they have kept
private.

## Outcome

The snippet is public at the same address, listed in Discover, and open for
other Developers to fork.

## Edge cases

- The snippet is unlisted rather than private → it becomes public the same way, and its address does not change.
- The Developer declines to confirm → the snippet keeps the visibility it had.

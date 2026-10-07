---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer sets the visibility of a private snippet they own to Unlisted
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product explains that anyone holding the address will be able to read the snippet, and that it will be listed nowhere
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
---

# Make a snippet unlisted

## Trigger

The owner wants one person or a small group to read a private snippet without
putting it out for everyone.

## Outcome

The snippet is unlisted: anyone with its address can read it, and it appears in
neither Discover nor search.

## Edge cases

- The Developer declines to confirm → the snippet stays private.

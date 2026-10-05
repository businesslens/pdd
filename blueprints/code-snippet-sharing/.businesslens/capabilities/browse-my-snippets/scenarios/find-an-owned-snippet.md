---
kind: primary
routes:
  web: Web
steps:
  - text: The Product lists the snippets the Developer owns, most recently changed first, with each one's language, tags and visibility
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Language, Tags] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
  - text: The Developer narrows the list to one language and one tag
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Language, Tags] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
  - text: The Developer opens a snippet from what remains
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
  - text: Nothing about the snippets changes by being listed
    kind: condition
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
---

# Find an owned snippet

## Trigger

The Developer wants a snippet they kept and remembers its language or how they
tagged it.

## Outcome

The Developer has the snippet open, found among their own, with nothing
changed.

## Edge cases

- The Developer narrows by visibility → only their private, unlisted or public snippets are listed.
- The Developer owns no snippets yet → the list says so and offers to start one.
- Nothing matches the narrowing → the list says so, and the narrowing can be cleared.

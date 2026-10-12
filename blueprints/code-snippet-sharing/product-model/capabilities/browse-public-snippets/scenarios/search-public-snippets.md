---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer enters a search term
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::discover
  - text: The Product finds the public snippets whose title, description or tags match the term
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Tags] }
      - { entity: developer, effect: reads, facts: [Username] }
    contexts:
      web:
        place: snippets-web::discover
  - text: The Developer opens a snippet from what was found
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::discover
---

# Search public snippets

## Trigger

A signed-in Developer is looking for code that does a particular thing.

## Outcome

The Developer has opened a public snippet that matched what they searched for,
where they can read and fork it.

## Edge cases

- Nothing matches the term → the Developer is told so, and the term stays available to change.
- The term matches one of the Developer's own unlisted or private snippets → it is not found here; their own snippets are found from their list.

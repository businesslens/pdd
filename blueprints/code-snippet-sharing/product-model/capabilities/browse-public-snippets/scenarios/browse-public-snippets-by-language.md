---
kind: primary
routes:
  web: Web
steps:
  - text: The Product lists public snippets, newest first, with each one's language, tags and owner
    kind: product
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Language, Tags] }
      - { entity: developer, effect: reads, facts: [Username] }
    contexts:
      web:
        place: snippets-web::discover
  - text: The Visitor narrows the list to one language and one tag
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Language, Tags] }
    contexts:
      web:
        place: snippets-web::discover
  - text: The Visitor opens a snippet from what remains
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::discover
---

# Browse public snippets by language

## Trigger

Someone without an account wants to see what others have shared in a language
they work in.

## Outcome

The Visitor has opened a public snippet they found by language and tag, without
signing in, and nothing was changed by finding it.

## Edge cases

- Nothing matches the narrowing → the list says so, and the narrowing can be cleared.

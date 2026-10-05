---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens the address of a public or unlisted snippet
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Product presents the snippet's title, description, owner, language and tags, and its code highlighted for its language
    kind: product
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Language, Tags, Code] }
      - { entity: developer, effect: reads, facts: [Username] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Visitor copies the code
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Code] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: Nothing about the Visitor is kept
    kind: condition
    actor: visitor
    entities: []
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
---

# Read a shared snippet

## Trigger

Someone without an account opens a snippet's address, from Discover or from a
link its owner passed on.

## Outcome

The Visitor has read and copied the code, without signing in and without
seeing anything else its owner keeps.

## Edge cases

- The snippet is a fork → the snippet it was forked from is named, and opens if it can still be read.
- The Visitor chooses to fork it → they are asked to sign in first, and return to the snippet as a Developer.

---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer starts a new piece of code from their list
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::my-snippets
  - text: The Developer enters the code, chooses its language, and gives it a title and, if they like, a description and tags
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer saves, leaving the visibility at Private
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product creates a private snippet owned by the Developer, at an address of its own, and keeps its code as revision 1
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: creates, to: Private, facts: [Title, Description, Language, Tags, Code, Address] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product opens the new snippet with its code highlighted for its language
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Language, Tags, Code, Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Create a private snippet

## Trigger

The Developer has a piece of code they want to keep.

## Outcome

The Developer owns a new private snippet with the code, language and details
they gave it, readable by nobody else, and its history starts at revision 1.

## Edge cases

- The Developer chooses Unlisted before saving → the snippet is created unlisted and its address is ready to share.
- The Developer leaves the editor without saving → nothing is kept.

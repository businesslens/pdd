---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer asks for suggested details for the code in the editor
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product sends the code and its language to a language model, which drafts a title, a description and tags
    kind: product
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product fills the title, description and tags fields with the draft, where the Developer can still change them
    kind: product
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: Nothing is kept until the Developer saves
    kind: condition
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Suggest details for the code

## Trigger

The Developer has written code and wants help giving it a title, a description
and tags.

## Outcome

The editor's title, description and tags fields hold the drafted details, still
editable, and the code, language and visibility are as the Developer left them.
The details are kept only when the Developer saves the snippet.

## Edge cases

- The fields already held a title, description or tags → they are replaced, and the Developer can rewrite them before saving.
- The Developer changes a drafted value before saving → the saved snippet keeps the Developer's wording.
- The Developer leaves the editor without saving → nothing is kept, the drafted details included.

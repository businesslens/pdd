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
  - text: The Snippet assistant reads the code and its language and proposes a title, a description and tags
    kind: actor
    actor: snippet-assistant
    entities:
      - { entity: suggestion, effect: creates, to: Proposed, facts: [Suggested title, Suggested description, Suggested tags] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product shows the suggestion beside the fields, which stay as the Developer left them
    kind: product
    actor: developer
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested title, Suggested description, Suggested tags] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer accepts the suggestion
    kind: actor
    actor: developer
    entities:
      - { entity: suggestion, effect: changes, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product places the suggested title, description and tags in their fields, where the Developer can still change them
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

# Accept suggested details

## Trigger

The Developer has written code and wants help giving it a title, a description
and tags.

## Outcome

The editor's fields hold the suggested title, description and tags, still
editable. They are kept only when the Developer saves the snippet.

## Edge cases

- The fields already held a title, description or tags → accepting replaces them, and the Developer can change them back before saving.
- The Developer changes an accepted value before saving → the saved snippet keeps the Developer's wording.
- The Developer leaves the editor without saving → nothing is kept, the accepted values included.

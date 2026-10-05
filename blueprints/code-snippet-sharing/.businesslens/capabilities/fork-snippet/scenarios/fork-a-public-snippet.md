---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer chooses to fork a public snippet another Developer owns
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product confirms the original snippet is still public
    kind: product
    actor: developer
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product creates a private snippet owned by the Developer with the original's title, description, language, tags and code, recording which snippet it was forked from, and keeps its code as revision 1
    kind: product
    actor: developer
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [Title, Description, Language, Tags, Code] }
      - { entity: snippet, as: fork, effect: creates, to: Private, facts: [Title, Description, Language, Tags, Code, Address, Forked from] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product opens the fork in the editor, ready to change
    kind: product
    actor: developer
    entities:
      - { entity: snippet, as: fork, effect: reads, facts: [Title, Description, Language, Tags, Code] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Fork a public snippet

## Trigger

A Developer finds a public snippet they want to adapt.

## Outcome

The Developer owns a private copy that names the snippet it came from, and is in
the editor of that copy, where saving a change continues as snippet editing.
The original and its owner are unaffected.

## Edge cases

- The snippet is the Developer's own → no fork is offered; they edit it instead.
- The Developer forks the same snippet again → another separate copy is made.

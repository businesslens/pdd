---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Developer forks a public snippet another Developer owns
    kind: actor
    actor: developer
    capability: fork-snippet
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [Title, Description, Language, Tags, Code] }
      - { entity: snippet, as: fork, effect: creates, to: Private, facts: [Title, Description, Language, Tags, Code, Address, Forked from] }
      - { entity: revision, as: first, effect: creates, facts: [Number, Code, Language, Saved at], with: fork }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product opens the fork in the editor, ready to change
    kind: product
    actor: developer
    capability: fork-snippet
    entities:
      - { entity: snippet, as: fork, effect: reads, facts: [Title, Description, Language, Tags, Code] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer changes the code of the fork and saves
    kind: actor
    actor: developer
    capability: edit-snippet
    entities:
      - { entity: snippet, as: fork, effect: changes, facts: [Code] }
      - { entity: revision, as: second, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product returns to the fork with its new code, the original it was forked from, and a history of two revisions
    kind: product
    actor: developer
    capability: edit-snippet
    entities:
      - { entity: snippet, as: fork, effect: reads, facts: [Code, Forked from] }
      - { entity: revision, as: second, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Fork and change a public snippet

## Trigger

A Developer reading a public snippet finds it nearly what they need.

## Outcome

The Journey goal is achieved: forking carried the Developer into the editor of
their private copy, which now holds their change as revision 2 and names the
original. The original snippet and its owner are unaffected.

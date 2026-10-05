---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner accepts a suggestion to file the first note
    kind: actor
    actor: owner
    capability: accept-suggestion
    entities:
      - { entity: suggestion, as: first, from: Pending, to: Accepted, facts: [] }
      - { entity: note, as: first, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product files the first note in the suggested notebook
    kind: product
    actor: owner
    capability: accept-suggestion
    entities:
      - { entity: note, as: first, from: Unsorted, to: Filed, facts: [Notebook, Tags] }
      - { entity: notebook, as: suggested, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner disagrees with the suggestion for the second note and chooses to file it themselves
    kind: actor
    actor: owner
    capability: dismiss-suggestion
    entities:
      - { entity: suggestion, as: second, from: Pending, to: Dismissed, facts: [] }
      - { entity: note, as: second, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product opens moving the second note straight away
    kind: product
    actor: owner
    capability: move-note
    entities:
      - { entity: note, as: second, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner picks one of their notebooks
    kind: actor
    actor: owner
    capability: move-note
    entities:
      - { entity: notebook, as: chosen, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product files the second note in the chosen notebook
    kind: product
    actor: owner
    capability: move-note
    entities:
      - { entity: note, as: second, from: Unsorted, to: Filed, facts: [Notebook] }
      - { entity: notebook, as: chosen, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Accept one suggestion and file another note yourself

## Trigger

The Owner opens their pending suggestions to clear the inbox.

## Outcome

The Journey goal is achieved: the first note is filed as suggested, the second
where the Owner chose, and both have left the inbox.

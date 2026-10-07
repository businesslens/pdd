---
entities:
  - { entity: note, shows: [Title, Body, Notebook, Tags, Linked notes, Last edited], collects: [Title, Body] }
  - { entity: notebook, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - notes-mobile: notes-app://notes/:noteId
---

# Note editor

One note opened to work on: its title and body to edit and another note to
link, with the notebook and tags it already has.

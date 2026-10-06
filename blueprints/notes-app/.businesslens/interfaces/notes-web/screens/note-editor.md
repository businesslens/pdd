---
entities:
  - { entity: note, shows: [Title, Body, Notebook, Tags, Linked notes, Last edited], collects: [Title, Body, Tags] }
  - { entity: tag, shows: [Name], collects: [Name] }
  - { entity: notebook, shows: [Name], collects: [Name] }
entryPoints:
  - notes-web: /notes/:noteId
---

# Note editor

One note opened to work on: its title, body and tags to edit and save together,
the notebook it is filed in, and the notes it links to. From here the owner
changes the words, links another note, tags it, files or moves it — into a
notebook created on the spot if needed — and deletes it.

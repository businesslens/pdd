---
entities:
  - { entity: note, shows: [Title, Created at], collects: [Title, Body] }
  - { entity: notebook, shows: [Name] }
entryPoints:
  - notes-web: /inbox
---

# Inbox

The notes not filed in any notebook yet, newest first, with the place to
capture another one and to file a note from the list.

## Intent

Show exactly what is left to sort, so the owner can empty it.

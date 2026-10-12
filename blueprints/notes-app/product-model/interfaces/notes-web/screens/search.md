---
entities:
  - { entity: note, shows: [Title, Body, Notebook, Tags] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - notes-web: /search
---

# Search

Finds the owner's notes by the words in their titles and bodies, optionally
narrowed to one tag, and opens what was found.

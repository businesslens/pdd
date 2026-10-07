---
entities:
  - { entity: notebook, shows: [Name], collects: [Name] }
  - { entity: note, shows: [Title, Last edited] }
entryPoints:
  - notes-web: /notebooks/:notebookId
---

# Notebook

One notebook and the notes filed in it, most recently edited first. This is
where the owner renames the notebook, or deletes it after being told that its
notes will return to the inbox.

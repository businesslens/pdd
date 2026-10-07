---
entities:
  - { entity: snippet, shows: [Title, Description, Language, Tags, Code], collects: [Title, Description, Language, Tags, Code] }
entryPoints:
  - snippets-web: /new
---

# Snippet editor

Where a snippet is written: a new one, or a revision of one the Developer owns.
It takes the code, its language, a title, a description and tags, and for a
new snippet its visibility. Here the Developer can ask for suggested details,
which fill the title, description and tags fields for them to change or keep.
Leaving without saving keeps nothing.

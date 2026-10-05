---
entities:
  - { entity: snippet, shows: [Title, Description, Language, Tags, Code], collects: [Title, Description, Language, Tags, Code] }
  - { entity: suggestion, shows: [Suggested title, Suggested description, Suggested tags] }
entryPoints:
  - snippets-web: /new
---

# Snippet editor

Where a snippet is written: a new one, or a revision of one the Developer owns.
It takes the code, its language, a title, a description and tags, and for a
new snippet its visibility. Here the Developer can ask the Snippet assistant to
suggest a title, description and tags, and accept or dismiss what it proposes.
Leaving without saving keeps nothing.

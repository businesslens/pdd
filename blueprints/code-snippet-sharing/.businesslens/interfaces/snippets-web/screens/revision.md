---
entities:
  - { entity: revision, shows: [Number, Code, Language, Saved at] }
  - { entity: snippet, shows: [Title] }
entryPoints:
  - snippets-web: /snippets/:snippetId/revisions/:revisionNumber
---

# Revision

One earlier revision of a snippet: its code highlighted for the language it had
then, when it was saved, and what changed from the revision before it. It is
open to anyone who may read the snippet, signed in or not.

---
entities:
  - { entity: snippet, shows: [Title, Description, Language, Tags, Code, Forked from] }
  - { entity: developer, shows: [Username] }
  - { entity: revision, shows: [Number, Saved at] }
entryPoints:
  - snippets-web: /snippets/:snippetId
---

# Snippet

One public or unlisted snippet read without an account: its title, description,
owner and tags, its code highlighted for its language, the snippet it was
forked from if any, and its history of revisions.

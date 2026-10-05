---
entities:
  - { entity: snippet, shows: [Title, Description, Language, Tags, Code, Address, Forked from] }
  - { entity: developer, shows: [Username] }
  - { entity: revision, shows: [Number, Saved at] }
entryPoints:
  - snippets-web: /snippets/:snippetId
---

# Snippet

One snippet opened by a signed-in Developer: its details, code highlighted for
its language, history of revisions and the snippet it was forked from if any.
On their own snippet the owner also sees its visibility and address, and edits,
shares, makes private or deletes it from here; on another Developer's public
snippet they fork it.

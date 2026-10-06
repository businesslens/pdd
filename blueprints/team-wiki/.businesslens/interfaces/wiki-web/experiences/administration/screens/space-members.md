---
entities:
  - { entity: space, shows: [Name] }
  - { entity: space-membership, shows: [Role], collects: [Role] }
  - { entity: member, shows: [Name] }
entryPoints:
  - wiki-web: /admin/spaces/:spaceKey/members
---

# Space members

The people who belong to one space and the role each holds there. An
Administrator adds a person from the workspace with a role, changes someone's
role, or removes someone.

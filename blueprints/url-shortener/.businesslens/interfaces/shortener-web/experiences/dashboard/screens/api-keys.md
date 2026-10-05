---
entities:
  - { entity: api-key, shows: [Name, Secret, Created at, Last used at], collects: [Name] }
entryPoints:
  - shortener-web: /settings/api-keys
---

# API keys

Lists the Owner's API keys by name, with when each was created and last used.
The Owner creates a key here, sees its secret once at creation, and revokes a
key a tool should no longer use.

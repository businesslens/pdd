---
domain: api-keys
relations:
  - entity: api-client
    verb: identifies
    cardinality: one-to-one
---

# API key

A credential an Owner issues so one of their tools can create links in their
account. A revoked key no longer exists, and a request presenting it is
refused.

## Information kept

- **Name** — what the Owner calls it, usually the tool it is for
- **Secret** — the value the API client presents with each request
- **Created at** — when the Owner created it
- **Last used at** — when an API client last presented it, if one has

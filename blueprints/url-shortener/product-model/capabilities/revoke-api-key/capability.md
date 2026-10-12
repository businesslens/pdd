---
domain: api-keys
availability: [{ place: shortener-web::dashboard }]
---

# API key revocation

Revokes one of the Owner's API keys for good, once the Owner confirms, so any
tool still presenting it is refused.

## Intent

Let an Owner cut off a tool they no longer trust or use, at once, without
touching the links it already created.

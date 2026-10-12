---
colorSlot: 2
---

# API keys

The keys an Owner issues so their own tools can create links through the API,
and the revocation that stops a tool from using one.

## Boundary

Owns which API keys exist, their names and secrets, and when each was last
used. It does not own the links a tool creates with a key: those are the
Owner's links like any other.

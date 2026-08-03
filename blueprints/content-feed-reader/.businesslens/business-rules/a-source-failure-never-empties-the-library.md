---
domains:
  - library
  - sources
capabilities:
  - source-refresh
---

# A source failure never removes items

Items already in the library stay in it when their source fails, disappears, or
returns a response that no longer lists them.

## Intent

Protect the reader from the network. The library is what the reader has; a failed
fetch is news about a source, not an instruction to forget anything.

## Rationale

A feed that returns an empty document, a 404, or a truncated window is making no
claim about items it served previously — most feeds only ever expose a recent
window. Treating absence as deletion would let a single bad response silently
destroy a backlog, and unfollowing is the only action that should ever remove a
source's items.

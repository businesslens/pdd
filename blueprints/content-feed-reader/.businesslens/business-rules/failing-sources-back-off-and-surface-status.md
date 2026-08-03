---
domains:
  - sources
capabilities:
  - source-refresh
---

# Repeated failure slows a source down and is visible

A source that fails repeatedly is fetched progressively less often, and its
health is shown to the reader wherever the source appears.

## Intent

Stop the product from hammering a dead address forever, without ever hiding from
the reader that something they follow has stopped working.

## Rationale

Silent failure is the worst outcome: the reader concludes the source has gone
quiet and stops expecting anything from it. Making health visible turns an
invisible failure into a decision the reader can act on — fix the address, or
unfollow.

Backing off is bounded rather than terminal. A source is never dropped
automatically, because recovery is common and the reader's decision to follow it
still stands.

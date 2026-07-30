---
domain: library
actors:
  - reader
experiences:
  - reading-app
businessRules:
  - reading-state-is-private-to-its-reader
---

# Reading state

Tracking which items a reader has read, presenting the unread backlog, and
letting a reader mark items read or unread individually or in bulk.

## Intent

A backlog has to feel finite or the reader stops opening the product. That makes
bulk "mark all read" a required capability rather than a convenience: the reader
needs a way to declare bankruptcy on a backlog without unfollowing the source
that produced it.

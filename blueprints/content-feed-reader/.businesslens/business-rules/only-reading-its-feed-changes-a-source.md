---
appliesTo:
  - type: entity
    id: source
    effect: changes
permits:
  - unattended: true
  - related: [{ verb: follows, entity: reader }]
---

# Only reading its feed changes a source

A source's record of whether it can be read, and when it last was, changes only
when the Product reads its feed: on the Product's own schedule, or when the
Reader who follows it refreshes their sources. Nobody edits a source by hand.

## Rationale

The record reports what the feed itself did, so only an attempt to read the feed
may change it.

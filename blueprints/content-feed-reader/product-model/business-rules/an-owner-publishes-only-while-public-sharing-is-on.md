---
appliesTo:
  - type: entity
    id: collection
    effect: changes
    to: Published
permits:
  - related: [{ verb: owns, entity: reader }]
    when: [{ entity: reader-settings, fact: Public sharing enabled, is: true }]
---

# An owner publishes only while public sharing is on

A collection becomes published only while public sharing is enabled for the
Product. While it is switched off, an owner who tries to publish is told that
publishing is unavailable and why, and the collection stays as it was;
collections already published stay readable.

## Rationale

Sharing is the one way library contents leave a Reader's private library, so
the Product keeps a single switch to stop new publication without touching
anything a Reader owns.

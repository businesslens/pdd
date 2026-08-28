---
relations:
  - entity: item
    verb: publishes
    cardinality: one-to-many
transitions:
  - from: Reachable
    to: Unreachable
    by: synchronize-feeds
  - from: Unreachable
    to: Reachable
    by: synchronize-feeds
domain: sources
---

# Source

A syndicated feed the Reader follows, and the Product's standing record of
whether it can still be read.

## Information kept

- The name the Reader knows it by
- Its feed address
- When it was last read successfully

## States

### Reachable

The feed was read successfully on the most recent attempt, and new items enter
the Reader's backlog from it.

### Unreachable

The feed could not be read on the most recent attempt. Items already collected
from it stay in the library, and the Product keeps trying on its own schedule.

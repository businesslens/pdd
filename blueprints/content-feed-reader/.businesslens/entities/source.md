---
relations:
  - entity: item
    verb: publishes
    cardinality: one-to-many
domain: sources
---

# Source

A syndicated feed the Reader follows, and the Product's standing record of
whether it can still be read.

## Information kept

- **Name** — the name the Reader knows it by
- **Feed address** — where its feed is fetched from
- **Last read** — when it was last read successfully

## States

### Reachable

The feed was read successfully on the most recent attempt, and new items enter
the Reader's backlog from it.

### Unreachable

The feed could not be read on the most recent attempt. Items already collected
from it stay in the library, and the Product keeps trying on its own schedule.

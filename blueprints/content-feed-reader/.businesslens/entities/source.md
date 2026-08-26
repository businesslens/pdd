---
domain: sources
---

# Source

A syndicated feed the Reader follows, and the Product's standing record of
whether it can still be read.

## States

### Reachable

The feed was read successfully on the most recent attempt, and new items enter
the Reader's backlog from it.

### Unreachable

The feed could not be read on the most recent attempt. Items already collected
from it stay in the library, and the Product keeps trying on its own schedule.

## Transitions

- Reachable → Unreachable
- Unreachable → Reachable

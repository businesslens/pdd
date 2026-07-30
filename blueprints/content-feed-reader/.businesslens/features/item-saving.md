---
domain: curation
actors:
  - reader
experiences:
  - reading-app
businessRules:
  - saved-items-outlive-their-source
---

# Item saving

Marking an item as worth keeping, and unsaving it.

## Intent

Saving is the boundary between what passed through the library and what the
reader decided to keep. Everything downstream — tags, collections, the durability
guarantee, and what may be pruned — hangs off this one act, which is why it is
one action and not a workflow.

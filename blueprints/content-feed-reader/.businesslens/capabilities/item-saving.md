---
domain: curation
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
---

# Item saving

Marking an item as worth keeping, and unsaving it.

## Intent

Saving is the boundary between what passed through the library and what the
reader decided to keep. Everything downstream — tags, collections, the durability
guarantee, and what may be pruned — hangs off this one act, which is why it is
one action and not a workflow.

---
domains:
  - curation
  - library
features:
  - item-saving
---

# Saving an item makes it permanent

An item a reader saved remains readable in their library after the source stops
serving it, is unfollowed, or disappears entirely.

## Intent

Make "save" mean what readers assume it means. A save is the reader's judgment
that this is worth keeping, and it must not depend on a third party continuing to
exist.

## Rationale

This is the product's core durability promise and the reason unsaved items may be
pruned while saved ones may not. It also decides what the product must retain at
save time: enough of the item's content to render it later without fetching
anything.

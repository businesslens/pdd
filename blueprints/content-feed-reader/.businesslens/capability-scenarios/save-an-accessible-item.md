---
kind: primary
capability: item-saving
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Save an accessible item

## Trigger

The Reader chooses to keep an item available in the private library.

## Steps

1. The Reader saves the item
2. The Product records the saved state independently of reading state

## Outcome

The item remains saved until the Reader explicitly removes it.

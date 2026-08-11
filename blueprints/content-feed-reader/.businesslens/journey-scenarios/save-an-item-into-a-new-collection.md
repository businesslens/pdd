---
kind: primary
journey: save-and-organize
actors: [reader]
result: achieved
flow:
  - id: save-item
    capability: item-saving
    operation: Save the worthwhile item
  - id: create-collection
    capability: collection-creation
    operation: Create and name an owned collection
  - id: add-to-collection
    capability: collection-organization
    operation: Add the saved item to the new collection
routes:
  - id: web
    contexts:
      - stage: save-item
        interface: reader-web
        experience: personal-library
      - stage: create-collection
        interface: reader-web
        experience: personal-library
      - stage: add-to-collection
        interface: reader-web
        experience: personal-library
  - id: mobile
    contexts:
      - stage: save-item
        interface: reader-mobile
        experience: personal-library
      - stage: create-collection
        interface: reader-mobile
        experience: personal-library
      - stage: add-to-collection
        interface: reader-mobile
        experience: personal-library
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Steps

1. The Reader saves the item
2. The Reader creates and names a collection
3. The saved item is added to the collection

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.

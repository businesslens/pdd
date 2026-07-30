---
kind: edge
businessRules:
  - saved-items-outlive-their-source
---

# A saved item outlives the source that published it

## Trigger

A reader searches for an item they saved from a source that has since gone
offline and been unfollowed.

## Steps

1. The search matches the saved item on the content the product retained
2. The item is shown with its original source named as no longer followed
3. The reader opens it and reads the retained content without any fetch happening

## Outcome

The save held. The reader gets the item back years after the site that published
it stopped existing, which is the durability the product promises.

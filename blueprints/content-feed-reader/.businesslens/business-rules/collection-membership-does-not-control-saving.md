---
domains: [curation]
capabilities: [item-saving, collections]
journeys: [save-and-organize]
scenarios: [remove-an-item-from-a-collection]
---

# Collection membership does not control saving

Adding or removing an item from a collection never saves or unsaves that item.

## Rationale

Keeping an item and organizing it are separate Reader decisions; changing one
must not silently reverse the other.

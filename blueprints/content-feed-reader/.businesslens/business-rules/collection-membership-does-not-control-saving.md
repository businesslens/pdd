---
domains: [curation]
capabilities: [item-saving, collections]
journeys: [save-and-organize]
capabilityScenarios: [add-an-item-to-an-owned-collection, remove-an-item-from-an-owned-collection]
journeyScenarios: [save-an-item-into-a-new-collection, save-an-item-into-an-existing-collection]
---

# Collection membership does not control saving

Adding or removing an item from a collection never saves or unsaves that item.

## Rationale

Keeping an item and organizing it are separate Reader decisions; changing one
must not silently reverse the other.

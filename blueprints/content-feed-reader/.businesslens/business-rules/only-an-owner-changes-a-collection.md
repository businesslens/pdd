---
domains: [collections]
capabilities: [collection-creation, collection-naming, collection-organization, collection-publication]
journeys: [save-and-organize, publish-and-share-a-collection]
capabilityScenarios:
  - create-an-owned-collection
  - rename-an-owned-collection
  - add-an-item-to-an-owned-collection
  - remove-an-item-from-an-owned-collection
  - reorder-an-owned-collection
  - reject-adding-to-another-owners-collection
  - publish-an-owned-collection
  - unlist-an-owned-collection
  - reject-publishing-another-owners-collection
journeyScenarios:
  - save-an-item-into-a-new-collection
  - save-an-item-into-an-existing-collection
  - publish-and-read-a-collection
---

# Only an owner changes a collection

Only the Reader who created a collection can change its contents, order, name,
or publication state.

## Rationale

A public link grants read access, never collaboration or ownership.

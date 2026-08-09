---
domains: [curation]
capabilities: [collections, collection-sharing]
journeys: [save-and-organize, share-a-collection]
capabilityScenarios:
  - reject-adding-to-another-owners-collection
journeyScenarios:
  - save-an-item-into-a-new-collection
  - save-an-item-into-an-existing-collection
  - publish-a-collection
  - unlist-a-published-collection
---

# Only an owner changes a collection

Only the Reader who created a collection can change its contents, order, name,
or publication state.

## Rationale

A public link grants read access, never collaboration or ownership.

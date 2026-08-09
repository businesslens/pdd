---
availability:
  - interface: reader-web
    experiences: [public-reading]
capabilities: [collection-sharing]
capabilityScenarios: [read-a-published-collection, open-an-unlisted-collection]
entryPoints:
  - reader-web: /collections/:collectionSlug
---

# Public collection

Presents one published collection to anyone holding its web address.

## Information presented

- Collection name and description
- Owner display name
- Ordered items the owner chose to publish

## Available actions

- Read an item in the collection
- Leave the collection

## Product states

### Published

The complete collection is readable without an account.

### Unlisted

The collection contents are no longer served and no private owner information
is revealed.

## Capability boundary

Read-only and limited to one published collection. It records no Visitor
reading state and exposes no private library content.

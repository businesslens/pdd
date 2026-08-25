---
capabilities:
  - collection-creation
  - collection-naming
  - collection-organization
  - collection-publication
entryPoints:
  - reader-web: /collections
---

# Collection workspace

Lets a Reader organize saved items and control whether an owned collection is
public.

## Information presented

- Collection name and ordered saved items
- Whether the collection is private or published
- The public link when the collection is published

## Available actions

- Create and rename an owned collection
- Add, remove, and reorder saved items
- Publish or unlist the collection

## Product states

### Private

Only the owner can see the collection.

### Published

The owner sees the public link and can revoke it immediately.

## Capability boundary

Only the owner changes the collection. Creation, naming, organization,
publication, and item saving remain separate Product decisions.

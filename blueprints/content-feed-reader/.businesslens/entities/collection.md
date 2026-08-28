---
relations:
  - entity: item
    verb: holds
    cardinality: many-to-many
transitions:
  - from: Private
    to: Published
    by: publish-collection
  - from: Published
    to: Unlisted
    by: publish-collection
  - from: Unlisted
    to: Published
    by: publish-collection
domain: collections
---

# Collection

An ordered group of saved items an owner curates and may share beyond their own
library.

## Information kept

- The name its owner gave it
- The order the owner arranged its items in
- Its public address once it has been published

## States

### Private

Visible only to its owner. No address outside the library resolves to it.

### Published

Readable by anyone who reaches its address, and discoverable as the owner's
public work.

### Unlisted

Readable only by someone who already holds its address. Publishing it again
restores discovery; unlisting revokes anonymous discovery without deleting the
collection.

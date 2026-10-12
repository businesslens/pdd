---
relations:
  - entity: item
    verb: holds
    cardinality: many-to-many
domain: collections
---

# Collection

An ordered group of saved items an owner curates and may share beyond their own
library. Deleting one removes it for good and leaves its items saved.

## Information kept

- **Name** — the name its owner gave it
- **Item order** — the order the owner arranged its items in
- **Public address** — where it is served once it has been published

## States

### Private

Visible only to its owner. No address outside the library resolves to it.

### Published

Readable by anyone who reaches its address, and discoverable as the owner's
public work.

### Unpublished

Withdrawn from its public address, which serves nothing until the owner
publishes it again. The collection itself is untouched.

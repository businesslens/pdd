---
domain: collections
---

# Collection

An ordered group of saved items an owner curates and may share beyond their own
library.

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

## Transitions

- Private → Published
- Published → Unlisted
- Unlisted → Published

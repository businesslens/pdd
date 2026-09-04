---
entities:
  - item
  - source
capabilities:
  - read-content
entryPoints:
  - reader-web: /items/:itemId
---

# Item reader

Presents one item's readable content with its source and publication context.
It is the same view whether the person arrived from their private library or
from a published collection, which is why it is shared across both Experiences
of the web application rather than belonging to one.

## Information presented

- The item's title, readable content, and publication date
- The source the item came from
- Where the person opened it from, so they can return there

## Available actions

- Return to the library or collection the item was opened from

## View states

### Readable

The item's content is available and shown in full.

### Withheld

The item belongs to a collection that is no longer public, so its content is not
served and no private owner information is revealed.

## Capability boundary

Reading only. Saving, collections, and reading-state changes happen in the
library; a Visitor's reading records nothing.

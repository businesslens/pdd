---
appliesTo:
  - { type: capability, id: save-bookmark }
  - { type: capability, id: edit-bookmark }
  - { type: capability, id: delete-bookmark }
---

# A tag exists while a bookmark carries it

A tag comes into being the first time a bookmark carries it and is removed when
the last bookmark carrying it loses it or is deleted. The library never lists
a tag that leads to nothing.

## Rationale

Tags are how the Owner narrows the library. One that leads to no bookmark is
noise in every place tags are offered.

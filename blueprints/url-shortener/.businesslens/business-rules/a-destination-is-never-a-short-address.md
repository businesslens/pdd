---
appliesTo:
  - type: capability
    id: create-link
  - type: capability
    id: edit-link
---

# A destination is never a short address

A link's destination is a web address outside the shortener. A destination
that is itself one of the Product's short addresses is refused, on the web and
through the API alike, whether the link is being created or changed.

## Rationale

A short address pointing at another short address hides the real destination
from the Owner and can send Visitors round in a loop that never arrives.

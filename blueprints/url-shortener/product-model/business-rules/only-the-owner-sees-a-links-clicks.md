---
appliesTo:
  - type: entity
    id: click
    effect: reads
permits:
  - related: [{ verb: receives, entity: link }, { verb: owns, entity: owner }]
---

# Only the Owner sees a link's clicks

A link's analytics — its clicks, when they happened, and the referring sites,
countries and devices they came from — are shown to the link's Owner and to
nobody else.

## Rationale

How often and from where a link is followed can reveal a campaign, an audience
or a private conversation the Owner has not chosen to share.

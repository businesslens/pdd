---
appliesTo:
  - type: capability
    id: declare-incident
  - type: capability
    id: post-incident-update
  - type: capability
    id: schedule-maintenance
  - type: capability
    id: cancel-maintenance
  - type: capability
    id: start-maintenance
  - type: capability
    id: complete-maintenance
---

# Only confirmed subscriptions are emailed

Incident updates and maintenance announcements go to every confirmed
subscription and to no other address. A pending subscription receives only its
confirmation link, and every message carries a link to unsubscribe.

## Rationale

Anyone can type any address into the page, so an address hears nothing until
its owner has confirmed they want to.

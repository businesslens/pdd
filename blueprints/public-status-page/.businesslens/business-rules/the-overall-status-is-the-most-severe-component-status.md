---
appliesTo:
  - type: capability
    id: view-status-page
  - type: entity
    id: component
    effect: reads
    facts: [Status]
    contexts: [{ place: status-web::public-page }]
---

# The overall status is the most severe component status

The page's overall status is the most severe status any component shows, from
least to most severe: Operational, Under maintenance, Degraded performance,
Partial outage, Major outage. While every component is Operational, the page
says all systems are operational.

## Rationale

Visitors read the overall status first. It must never look better than the
worst thing a component says.

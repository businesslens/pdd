---
domain: incidents
availability: [{ place: status-web::operator-console }]
---

# Update posting

Adds an Operator's update to an incident's public timeline, moves the incident
to the status the update announces, and emails it to confirmed subscribers.
Posting the update that resolves an incident closes it.

## Intent

Keep visitors told what is happening as an incident unfolds, until it is over.

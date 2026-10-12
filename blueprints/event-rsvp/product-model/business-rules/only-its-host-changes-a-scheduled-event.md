---
appliesTo:
  - type: entity
    id: event
    effect: changes
permits:
  - related: [{ verb: owns, entity: host }]
    when: [{ state: Scheduled }]
---

# Only its host changes a scheduled event

An event's details, its capacity and whether it is cancelled are changed only
by the Host who created it, and only while it is scheduled. A cancelled event
stays as it was cancelled.

## Rationale

Guests act on what the invitation says. Once an event is called off, changing
it again would send guests conflicting news about something that is not
happening.

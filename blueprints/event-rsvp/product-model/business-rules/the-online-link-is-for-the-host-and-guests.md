---
appliesTo:
  - type: entity
    id: event
    effect: reads
    facts: [Online link]
permits:
  - related: [{ verb: owns, entity: host }]
  - related: [{ verb: has, entity: rsvp }, { verb: gives, entity: guest }]
    when: [{ state: Scheduled }]
---

# The online link is for the host and guests

Where to join an online event is shown to its Host, and to a Guest who opens
it through the personal link of their RSVP while the event is scheduled. The
public invitation says only that the event is online, and a cancelled event
shows no link.

## Rationale

The invitation link travels further than the host intended. Keeping where to
join behind an answer keeps people the host never heard from out of the call.

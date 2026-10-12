---
appliesTo:
  - type: entity
    id: rsvp
  - type: entity
    id: event
    facts: [Capacity, Spots left]
---

# Going guests stay within capacity

The going RSVPs of an event, plus-ones included, never take more spots than its
capacity holds. A yes that does not fit joins the waitlist, and a plus-one that
does not fit is refused. Lowering the capacity never removes anyone already
going; it only leaves no spots until enough guests change their answer.

## Rationale

Capacity is the host's promise to a venue or a call. It has to hold without the
host watching every answer as it arrives.

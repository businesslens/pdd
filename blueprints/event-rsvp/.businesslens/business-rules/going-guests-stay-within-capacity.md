---
appliesTo:
  - type: capability
    id: rsvp-to-event
  - type: capability
    id: change-rsvp
  - type: capability
    id: promote-from-waitlist
  - type: capability
    id: edit-event
---

# Going guests stay within capacity

The guests going to an event, plus-ones included, never take more spots than
its capacity holds. A yes that does not fit joins the waitlist, and a plus-one
that does not fit is refused. Lowering the capacity never removes anyone
already going; it only leaves no spots until enough guests change their answer.

## Rationale

Capacity is the host's promise to a venue or a call. It has to hold without the
host watching every answer as it arrives.

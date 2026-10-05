---
appliesTo:
  - type: capability
    id: rsvp-to-event
  - type: capability
    id: change-rsvp
  - type: capability
    id: promote-from-waitlist
---

# Answers close when the event starts

An event takes new answers, changed answers and waitlist moves only while it is
scheduled and has not started. After that, the guest list stays as it stood.

## Rationale

The guest list at the start time is what the host plans the gathering around;
answers arriving later would change it after it no longer matters.

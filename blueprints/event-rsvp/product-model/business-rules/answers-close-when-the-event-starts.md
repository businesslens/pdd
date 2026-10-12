---
appliesTo:
  - type: entity
    id: rsvp
    effect: creates
  - type: entity
    id: rsvp
    effect: changes
  - type: entity
    id: rsvp
    effect: removes
---

# Answers close when the event starts

An event's RSVPs are given, changed, moved off the waitlist and removed only
while the event is scheduled and has not started. After that, the guest list
stays as it stood.

## Rationale

The guest list at the start time is what the host plans the gathering around;
answers arriving later would change it after it no longer matters.

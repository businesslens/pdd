---
entities:
  - { entity: event, shows: [Title, Description, Starts at, Ends at, Place, Online link, Plus-ones allowed, Spots left] }
  - { entity: host, shows: [Name] }
  - { entity: rsvp, shows: [Name, Plus-one], collects: [Name, Email, Plus-one] }
entryPoints:
  - rsvp-web: /i/:invitationCode
  - rsvp-web: /i/:invitationCode/me/:rsvpCode
---

# Invitation

Presents one event's invitation — what it is, when and where, who is hosting,
and how many spots are left — and takes an answer: going, maybe or not going,
with a name, an email and, where allowed, a plus-one. Opened through the
personal link of a Guest's RSVP, it shows that answer, lets them change it with
the same choices, and for an online event shows where to join. Once the event
is cancelled or has started it says so and takes no answers.

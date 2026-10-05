---
entities:
  - { entity: event, shows: [Title, Description, Starts at, Ends at, Place, Online link, Plus-ones allowed, Spots left] }
  - { entity: host, shows: [Name] }
  - { entity: guest, shows: [Name, Plus-one], collects: [Name, Email, Plus-one] }
entryPoints:
  - rsvp-web: /i/:invitationCode
  - rsvp-web: /i/:invitationCode/me/:guestCode
---

# Invitation

Presents one event's invitation — what it is, when and where, who is hosting,
and how many spots are left — and takes an answer: going, maybe or not going,
with a name, an email and, where allowed, a plus-one. Opened through a Guest's
personal link, it shows that Guest's own answer, lets them change it, and for
an online event shows where to join. Once the event is cancelled or has
started it says so and takes no answers.

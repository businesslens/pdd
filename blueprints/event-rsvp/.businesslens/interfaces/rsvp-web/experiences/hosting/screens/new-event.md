---
entities:
  - { entity: event, collects: [Title, Description, Starts at, Ends at, Place, Online link, Capacity, Plus-ones allowed] }
entryPoints:
  - rsvp-web: /events/new
---

# New event

Takes a Host through creating an event: what it is called and what guests
should know, when it starts and ends, where it happens in person, online or
both, how many people it can take, and whether guests may bring a plus-one.
The Host can leave before creating it without an event being made.

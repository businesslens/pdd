---
entities:
  - { entity: event, shows: [Title, Description, Starts at, Ends at, Place, Online link, Capacity, Plus-ones allowed, Invitation link, Spots left], collects: [Title, Description, Starts at, Ends at, Place, Online link, Capacity, Plus-ones allowed] }
  - { entity: rsvp, shows: [Name, Email, Plus-one, Responded at] }
  - { entity: message, shows: [Subject, Recipients, Sent at] }
entryPoints:
  - rsvp-web: /events/:eventId
---

# Event

One event the Host holds, opened to look after it. It presents the event's
details and invitation link to share, lets the Host change the details or
cancel the event, and shows the guest list: who is going with how many
plus-ones, who might come, who cannot, and who is waiting in order, with the
total going against capacity, and removes an RSVP once the Host confirms. It
lists the messages already sent and starts a new one.

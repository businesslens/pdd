---
entities:
  - { entity: event, shows: [Title] }
  - { entity: message, shows: [Subject, Body, Recipients], collects: [Subject, Body, Recipients] }
entryPoints:
  - rsvp-web: /events/:eventId/messages/new
---

# New message

Takes a Host through writing an email to an event's guests: choosing which
answers it goes to and seeing how many guests that reaches, writing a subject
and body or starting from suggested wording, and sending it. The Host can
leave before sending without anything being sent or kept.

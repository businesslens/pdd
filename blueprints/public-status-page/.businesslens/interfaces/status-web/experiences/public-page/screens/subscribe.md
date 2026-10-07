---
entities:
  - { entity: subscription, shows: [Email address], collects: [Email address] }
entryPoints:
  - status-web: /subscribe
  - status-web: /subscribe/confirm/:token
---

# Subscribe

Where a Visitor enters an email address to receive updates, and where the
confirmation link sent to that address lands.

---
entities:
  - { entity: subscription, shows: [Email address] }
entryPoints:
  - status-web: /unsubscribe/:token
---

# Unsubscribe

Where the unsubscribe link in every update email lands: it names the address
that will stop receiving updates.

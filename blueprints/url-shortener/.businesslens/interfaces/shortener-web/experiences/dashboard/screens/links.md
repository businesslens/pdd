---
entities:
  - { entity: link, shows: [Slug, Destination, Created at, Expires at] }
  - { entity: click, shows: [Clicked at] }
entryPoints:
  - shortener-web: /links
---

# Links

Lists the Owner's links, newest first, with each one's short address,
destination, state, expiry and how many times it has been followed. The Owner
finds a link here by its slug or destination, opens one, or starts a new one.

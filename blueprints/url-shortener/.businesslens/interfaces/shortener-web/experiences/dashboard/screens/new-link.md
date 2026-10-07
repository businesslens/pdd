---
entities:
  - { entity: link, shows: [Slug, Destination, Expires at], collects: [Destination, Slug, Expires at] }
entryPoints:
  - shortener-web: /links/new
---

# New link

Takes an Owner through creating a link: the destination it leads to, a slug of
their own or one the Product generates, and an optional expiry. A refused slug
or destination is explained here, with everything entered kept to correct, and
a created link's short address is shown here, ready to copy.

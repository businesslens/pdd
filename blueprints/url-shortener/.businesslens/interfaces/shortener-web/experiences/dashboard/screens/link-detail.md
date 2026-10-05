---
entities:
  - { entity: link, shows: [Slug, Destination, Created at, Expires at], collects: [Destination, Expires at] }
  - { entity: click, shows: [Clicked at, Referring site, Country, Device] }
entryPoints:
  - shortener-web: /links/:linkId
---

# Link detail

One of the Owner's links: its short address, destination, state, expiry and
when it was created, and how it has been followed — clicks over time, and the
referring sites, countries and devices they came from. Here the Owner changes
the destination or the expiry, and disables or enables the link. A link the
Owner has just created opens here.

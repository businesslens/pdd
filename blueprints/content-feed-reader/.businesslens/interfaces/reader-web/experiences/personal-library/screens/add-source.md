---
entities:
  - { entity: source, shows: [Name, Feed address], collects: [Feed address] }
entryPoints:
  - reader-web: /sources/new
---

# Add source

Takes a Reader through following a new source: giving the feed address, being
told when no supported feed is found there so the address can be corrected,
then confirming the source the Product found by the name the feed gives itself
and the address it will be read from. The Reader can leave before confirming
without a source being followed.

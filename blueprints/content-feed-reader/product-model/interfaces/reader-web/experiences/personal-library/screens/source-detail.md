---
entities:
  - { entity: source, shows: [Name, Feed address, Last read] }
entryPoints:
  - reader-web: /sources/:sourceId
---

# Source detail

Presents the source the Reader picked from the list: what it is called, the
address its feed is read from, and when it was last read successfully. This is
where the Reader stops following it, after confirming what will be kept.

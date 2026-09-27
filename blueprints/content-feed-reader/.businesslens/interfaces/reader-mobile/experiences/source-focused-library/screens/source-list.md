---
entities:
  - { entity: source, shows: [Name, Feed address, Last read] }
entryPoints:
  - reader-mobile: content-reader://library/sources
---

# Source list

Shows which feeds contribute to the Reader's library and whether each could be
read at the last refresh, provides the place to follow another one, and lets
the Reader read them again on demand.

## Intent

Give the Reader one place to decide which sources may contribute items and to
ask for their new items now.

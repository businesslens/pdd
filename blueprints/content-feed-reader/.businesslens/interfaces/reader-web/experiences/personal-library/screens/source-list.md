---
entities:
  - { entity: source, shows: [Name, Last read] }
entryPoints:
  - reader-web: /sources
---

# Source list

Shows which feeds contribute to the Reader's library and whether each could be
read at the last refresh, lets the Reader read them all again on demand, and
opens one source to inspect it or stop following it.

## Intent

Give the Reader one place to decide which sources may contribute items and to
ask for their new items now.

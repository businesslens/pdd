---
actors: [reader, visitor]
entryPoints:
  - web: /
---

# Reader web application

The supported browser Interface for a Reader's private library and public
collection links.

## Capability boundary

Supports every Reader- and Visitor-facing capability, including refreshing the
feeds the Reader follows. Private library behavior requires a Reader session;
public collection reading does not.

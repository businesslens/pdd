---
actors:
  - collection-owner
  - collection-subscriber
  - reader
  - visitor
entryPoints:
  - ios: content-reader://library
  - android: content-reader://library
---

# Reader mobile application

The supported mobile interface for reading, curation, accounts, and shared
collections.

## Capability boundary

Supports the same intended reader-facing and visitor-facing capabilities as the
web application. It does not expose product administration or internal
operations.

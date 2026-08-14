---
domain: sources
references:
  - kind: spec
    role: context
    target: https://www.rssboard.org/rss-specification
    title: RSS 2.0 specification
availability: [reader-web::personal-library, reader-mobile::personal-library]
---

# Feed synchronization

Collects new items from the Reader's followed syndicated feeds into their
private library. The Product reads each followed feed itself — when the Reader
refreshes their sources, and on a recurring schedule the Product owns — and
keeps earlier library items when a feed cannot be read.

## Intent

Keep the library current while preserving the Reader's durable history across
temporary source failures. A feed provider is a source the Product reads on the
Reader's behalf; it never reaches into the Reader's library.

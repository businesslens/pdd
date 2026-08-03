---
domain: curation
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
---

# Library search

Searching titles and body text across everything in a reader's library, saved or
not, and narrowing by source, tag, and read state.

## Intent

This is what makes the library worth accumulating: the reader who half-remembers
something from months ago has to be able to find it. Search therefore covers
unsaved items too, because the thing a reader is looking for is frequently
something they never thought to save.

Search reads the content the product already fetched. It does not go back out to
the network, so it works on sources that have since disappeared.

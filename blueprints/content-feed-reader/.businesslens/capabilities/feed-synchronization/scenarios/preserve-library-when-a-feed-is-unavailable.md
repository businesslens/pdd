---
kind: edge
actors: [reader]
availability: [reader-web::personal-library, reader-mobile::personal-library]
---

# Preserve the library when a feed is unavailable

## Trigger

The Reader refreshes their sources while one followed feed cannot be read.

## Steps

1. The Product reports that the source could not be reached
2. Existing items, reading state, saved state, and collections remain unchanged
3. The source remains followed for a later refresh

## Outcome

A temporary feed failure does not erase library history or silently unfollow the source.

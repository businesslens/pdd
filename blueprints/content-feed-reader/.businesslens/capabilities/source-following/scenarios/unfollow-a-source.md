---
kind: primary
actors: [reader]
availability: [reader-web::personal-library, reader-mobile::personal-library]
---

# Unfollow a source

## Trigger

The Reader chooses to stop following an existing source.

## Steps

1. The Product removes the source from the Reader's followed sources
2. Future synchronization no longer collects items from that source
3. Existing library items and saved state are preserved

## Outcome

The source contributes no future items and the Reader's existing library history remains intact.

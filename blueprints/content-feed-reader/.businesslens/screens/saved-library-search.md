---
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
capabilities:
  - item-saving
  - item-tagging
  - library-search
scenarios:
  - a-search-matches-nothing
  - find-an-item-by-remembered-words
  - find-an-item-whose-source-is-gone
  - narrow-a-search-by-tag-and-source
  - save-an-item-while-reading
  - tag-a-saved-item
entryPoints:
  - reader-web: /saved
  - reader-web: /search
  - reader-mobile: content-reader://library/saved
---

# Saved library and search

Lets a reader keep worthwhile items, describe them in their own vocabulary, and
find library content again from partial memory.

## Intent

Make accumulated reading useful months later without requiring the reader to
predict at reading time exactly how an item will be rediscovered.

## Information presented

- Saved items and their tags
- Search results from fetched titles and body text
- Active source, tag, and read-state filters
- Whether an item's original source is no longer available

## Available actions

- Search remembered words
- Narrow results by source, tag, or read state
- Save or unsave an item
- Add or remove reader-defined tags on a saved item
- Open an item from the result set

## Product states

### Saved items

The reader can browse durable saved content and the tags applied to it.

### Search results

Matching library items are shown with enough context to recognize the desired
item and understand the active filters.

### No matches

The query and filters remain available to revise, and the empty result does not
imply that library content was removed.

### Original source gone

Fetched and saved content remains readable while the unavailable origin is
identified honestly.

## Capability boundary

Search reads only content already fetched into this reader's library and never
follows links or queries sources live. Tags apply only to saved items. This
Screen does not arrange collections or change source-following state.

---
capabilities:
  - read-content
  - save-item
entryPoints:
  - reader-mobile: content-reader://library/saved
---

# Saved items

Presents the durable items a Reader chose to keep and provides a direct way to
return to their content.

## Information presented

- Saved items with source and publication context
- The time each item was saved
- Whether an item belongs to any owned collection

## Available actions

- Open and read a saved item
- Remove an item's saved state
- Continue to collection organization on the web

## Product states

### Saved items available

The Reader can revisit kept content independently of unread state.

### Nothing saved

The Reader sees that the saved library is empty and can return to unread items.

## Capability boundary

Presents and removes saved items. It does not silently change reading state or
collection membership.

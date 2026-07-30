---
kind: primary
businessRules:
  - saved-items-outlive-their-source
---

# Unfollowing removes a source but keeps what was saved

## Trigger

A reader decides a permanently failing source is not coming back and unfollows
it.

## Steps

1. The product states what will be removed and what will be kept
2. The reader confirms
3. The source and its unsaved items leave the library, and the unread count drops accordingly
4. Items the reader saved from that source remain, readable and searchable, and stay in any collection they are part of

## Decision points

### Saved items from this source

Has the reader saved anything from the source being unfollowed?

- yes → say how many items will be kept, so the reader knows the save survives
- no → confirm plainly that the source and its items will be removed

## Outcome

The reader is rid of a dead source without losing anything they had decided was
worth keeping.

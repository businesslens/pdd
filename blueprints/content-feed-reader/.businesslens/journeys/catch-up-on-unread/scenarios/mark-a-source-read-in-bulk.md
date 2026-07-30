---
kind: primary
---

# A reader declares bankruptcy on a source's backlog

## Trigger

A reader with an unmanageable backlog chooses to mark everything from one source,
or their whole library, as read.

## Steps

1. The product states how many items will be affected
2. The reader confirms
3. Every affected item becomes read
4. The unread count updates and the backlog empties of those items

## Outcome

The backlog is cleared without unfollowing anything, so the source keeps
delivering and the reader keeps their saved items and their sources.

## Edge cases

- Items saved by the reader are marked read like any other; saving and reading are independent
- New items arriving after the confirmation are unread, because they were not part of what the reader confirmed

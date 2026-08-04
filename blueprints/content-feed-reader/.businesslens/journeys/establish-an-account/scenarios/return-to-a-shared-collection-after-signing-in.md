---
kind: edge
---

# Signing in returns the reader to the collection that sent them

## Trigger

A visitor reading a public collection chooses to subscribe, which requires an
account, and completes sign-in or registration.

## Steps

1. The product records which collection the visitor came from
2. The visitor signs in or registers
3. The reader is returned to that collection rather than to the unread backlog
4. The subscribe action is still available and has not been performed on their behalf

## Outcome

The reader is back where they started, holding a session, with the action they
originally wanted still theirs to take.

## Edge cases

- The collection was unlisted during the detour → the reader lands in the reading application with a message that the collection is no longer available

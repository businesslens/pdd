---
kind: primary
businessRules:
  - reading-state-is-private-to-its-reader
---

# A visitor reads a published collection without an account

## Trigger

Someone without an account opens the public address of a published collection.

## Steps

1. The collection is shown with its name, description, owner's display name, and items in the owner's order
2. The visitor opens and reads items from it
3. No reading state is recorded, because the visitor has no library
4. The visitor is offered the option to establish an account and subscribe

## Outcome

The visitor gets the collection the owner meant to share, and the owner's reading
state and remaining library stay invisible.

## Edge cases

- The visitor already holds a session → they see the same collection plus the option to subscribe to it directly

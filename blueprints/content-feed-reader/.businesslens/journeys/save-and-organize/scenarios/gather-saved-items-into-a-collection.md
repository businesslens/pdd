---
kind: primary
---

# A reader gathers saved items into a collection

## Trigger

A reader creates a collection, names it, describes what it is for, and adds saved
items to it.

## Steps

1. The collection is created, private, owned by the reader
2. The reader adds saved items to it and orders them deliberately
3. The collection shows its items in the order the reader set
4. The collection is visible only to its owner until it is published

## Decision points

### What can enter a collection

Is the item the reader is adding saved?

- saved → add it to the collection
- not saved → save it as part of the same action, so a collection never contains something the product may prune

## Outcome

The reader has a named, ordered, described group of items that is theirs alone
until they decide otherwise.

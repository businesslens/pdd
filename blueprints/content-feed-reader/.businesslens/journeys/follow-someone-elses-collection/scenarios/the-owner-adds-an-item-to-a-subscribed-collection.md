---
kind: primary
---

# A subscribed collection updates when its owner changes it

## Trigger

The owner of a collection someone subscribes to adds an item to it.

## Steps

1. The item appears in the collection for every subscriber, in the owner's chosen order
2. Subscribers see that the collection has changed since they last looked
3. The item does not enter any subscriber's saved items unless that subscriber saves it
4. Reading the item records reading state in the subscriber's own library only

## Outcome

The subscriber gets the update they subscribed for, while their library stays
theirs — nothing was added to it on someone else's authority.

## Edge cases

- The owner removing an item removes it for subscribers too, except where a subscriber had saved it into their own library

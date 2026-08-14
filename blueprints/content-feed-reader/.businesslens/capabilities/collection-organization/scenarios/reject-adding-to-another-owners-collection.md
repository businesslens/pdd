---
kind: validation
actors: [reader]
availability: [reader-web::personal-library]
---

# Reject adding to another owner's collection

## Trigger

The Reader attempts to change a collection owned by someone else.

## Steps

1. The Product checks collection ownership
2. The attempted membership change is rejected

## Outcome

The collection is unchanged and the Reader gains no editing authority.

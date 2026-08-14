---
kind: validation
actors: [reader]
availability: [reader-web::personal-library]
---

# Reject publishing another owner's collection

## Trigger

The Reader attempts to change the publication state of a collection owned by someone else.

## Steps

1. The Product checks collection ownership
2. The attempted publication change is rejected

## Outcome

The collection's publication state is unchanged and the Reader gains no authority over it.

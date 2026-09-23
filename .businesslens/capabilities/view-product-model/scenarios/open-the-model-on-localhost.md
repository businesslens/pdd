---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer asks to view the current Product Model
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: businesslens-cli
  - text: The Product checks the model's structure, serves it on the local machine, prints the address, and opens a browser
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: businesslens-cli
  - text: The Developer reads what the Product is and how much of it is modeled
    kind: actor
    actor: developer
    entities:
      - { entity: product, effect: reads }
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer moves to a kind's collection and opens the resource they came for
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product opens that resource’s reading at its own address, while preserving the collection behind it
    kind: product
    entities: []
    contexts:
      local:
        place: local-report-web::resource-reading
---

# Open the model on localhost

## Trigger

The Developer wants to read the model they are authoring rather than the files
it is stored in.

## Outcome

The model is readable on the Developer's own machine, the open resource is in the
address bar, and nothing has been written or transmitted.

## Edge cases

- A local report started before a model exists waits for its creation; an invalid model shows structural errors until its first valid save.
- Valid edits update the open report automatically; an invalid edit keeps the last valid reading visible until corrected.
- Asking for a specific port, or for the address to be printed without opening a browser, changes only how the report is reached.
- Searching by name lands on the resource's reading directly, for the same reason a collection row does.
- Coverage presents Scope, Method and four cards counting and filtering Covered, Exclusions, Unmapped and Limitations in one summary above the location tree.
- The location tree marks each path with its categories' icons, finds paths by name, and reads a path's statements in place; statements without paths remain visible below the tree.
- Coverage paths and References never establish file-level completeness or implementation alignment.
- Planned paths and gaps without locations remain readable without repository access.

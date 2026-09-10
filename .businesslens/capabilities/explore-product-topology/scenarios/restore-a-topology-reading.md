---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens a resource from the selected named reading and returns with browser Back
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product restores the selected reading and its scroll position or graph zoom and pan
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer reloads the report or saves a valid edit to the Product Model
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product retains surviving selections and explicit group choices and clears references to resources removed by the edit
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
---

# Restore a named reading

## Trigger

The Developer has selected a resource visualization, Journey or target, filters, and group choices.

## Outcome

The Developer resumes the same reading after navigation, refresh, or a valid recompile. A model error leaves the last valid report available.

## Edge cases

- Journey Scenario reading mode and composition window survive browser Back, refresh, and valid model edits.
- Interface delivery expansion choices survive opening a resource, returning, and refreshing.

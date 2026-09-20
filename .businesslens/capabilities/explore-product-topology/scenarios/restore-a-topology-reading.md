---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens a resource from the selected drawing and returns with browser Back
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
- Expansion choices in the Experiences & Screens and Screens tabs survive opening a resource, returning, and refreshing.

- Opening a resource preserves the selected collection or comparison, drawing, filters, expansion and viewport behind its reading.
- Following Journey → Entity → Business Rule and using Back restores each previous resource’s tab, expanded Scenario and reading position. Close dismisses the resource reading and returns to the original working view.
- The underlying view and resource tab have independent addresses: a Graph remains selected while an Entity Lifecycle is open, including after refresh.
- Opening a relationship from Connections and returning with Back restores Connections and its reading position; refresh preserves that reading too.
- References remains selected after refresh and after leaving the resource and returning with Back, including a Scenario's own References.
- A direct resource address without an originating view opens over its owning collection. A removed resource closes its reading while keeping the working view available.

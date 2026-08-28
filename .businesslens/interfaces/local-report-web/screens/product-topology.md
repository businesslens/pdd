---
entities:
  - product-model
  - element
capabilities: [explore-product-topology]
entryPoints:
  - local-report-web: /?s=topology
---

# Product topology

Cross-kind structure, drawn as one of a fixed set of named views. Each view owns
a question and states how it derives its answer, so the reading is accountable
rather than assembled by the reader.

## Information presented

- The selected view's name, its question, and the note explaining its derivation
- The ordered flow of kinds the view reads through
- Every entity the view includes, labelled and shaped by kind
- The relations the view draws, quiet until a node is hovered or selected in the views that say so
- Which kinds are currently hidden or filtered

## Available actions

- Switch to another named view
- Hide a kind or narrow the view by a filter
- Focus one entity and read only its neighbourhood
- Open an entity's page from the canvas

## View states

### Whole view

Every entity the named view includes, at the report's full width.

### Focused neighbourhood

One entity and the relations reaching it, so a dense view stays readable.

## Capability boundary

Correlations the model already declares, through views the Product has named and
is accountable for. It offers no view builder, opens onto no empty configuration
screen, and invents no relation the model does not author.

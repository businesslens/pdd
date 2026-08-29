---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens the Topology and chooses the view whose question matches what they want to know
    kind: actor
    actor: developer
    contexts:
      local:
        place: local-report-web::product-topology
  - text: The Product draws that view's kinds in its stated order and shows the question and the derivation it used
    kind: product
    contexts:
      local:
        place: local-report-web::product-topology
  - text: The Developer opens a resource from the canvas
    kind: actor
    actor: developer
    contexts:
      local:
        place: local-report-web::product-topology
---

# Read a named topology view

## Trigger

The Developer has a question that spans resource types — what the product can do,
where each Actor enters, what an Interface contains, what it keeps and how those
things relate, or where an invariant reaches.

## Outcome

The Developer has an answer to a question the Product named, drawn from
relations the model already authors, and can leave the canvas for any resource's
page.

## Edge cases

- A view that would be unreadable at full density draws its relations quietly until a node is hovered or selected.

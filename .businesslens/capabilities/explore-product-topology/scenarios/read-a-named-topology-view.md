---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens the collection that owns their question, then its named view alongside the List
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product presents the view with the question it answers, readable resource titles, and its available derivation
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer opens a resource directly from the reading
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
---

# Read a named resource visualization

## Trigger

The Developer has a question that spans resource types — what the product can do,
where each Actor enters, what an Interface contains, what it keeps and how those
things relate, what changes what, or where an invariant reaches.

## Outcome

The Developer has an answer to a question the Product named, drawn from
relations the model already authors, and can leave the reading for any resource's
page.

## Edge cases

- Interface map is a connected tree: the Product root branches into Interfaces and their actual Experiences and Screens. Every visible non-root node has a containment connector to its parent, including on narrow screens. Expanding a branch reveals connected children; selecting a node opens its resource page.
- Journey composition covers every Journey in the model and preserves every Capability-bearing Step in order, including repeated uses and non-achieved variations, with each Step's exact route Contexts. Each Journey windows its own Scenarios, and the complete Scenario remains available from its page.
- What changes what shows each Capability's creates, changes, and removes effects on Entities, with the supporting Scenarios. Reads do not become mutations.
- Entity relationships retains disconnected Entities and each authored relation's direction and both cardinalities, including self-relations and multiple distinct relations between the same Entities.
- A delayed or unavailable diagram arrangement leaves the complete resource and relationship reading available.

- A named view states its question once, above the reading: the collection heading names the subject and the tab names the view, so the reading never titles itself a third time.
- An address naming a view this report does not have opens the Overview rather than guessing at a replacement.

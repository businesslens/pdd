---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens the collection that owns their question and switches its drawing from Rows to Graph
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

- Interface map is a connected tree: the Product root branches into Interfaces and their actual Experiences and Screens. Every visible non-root node has a containment connector to its parent, including on narrow screens. Expanding a branch reveals connected children; selecting a node opens its resource reading.
- A reach tree roots at the Product and branches through each Domain, Capability, Journey or Business Rule to the places it is reached in and the Rules attached to it. A place reached from two subjects is drawn under each; selecting either opens the one page.
- What changes what shows each Capability's creates, changes, and removes effects on Entities, with the supporting Scenarios. Reads do not become mutations.
- Compare delivery is a Capability by Interface matrix stating the authored route for each cell. A row with more than one cell is delivered by more than one Interface; a row with one is exclusive to it. An empty cell claims only that no Context authorises that delivery.
- Entity relationships retains disconnected Entities and each authored relation's direction and both cardinalities, including self-relations and multiple distinct relations between the same Entities.
- A delayed or unavailable diagram arrangement leaves the complete resource and relationship reading available.

- A Graph states its question once, below the drawing: the collection heading names the subject and the switch names the drawing, so the reading never titles itself a third time. Switching back to Rows keeps the filters and the count.
- Compare delivery, What changes what and Rule attachments compare two collections at once, so each is a rail row of its own below Overview, with no tabs.
- An address naming a view this report does not have opens the Overview rather than guessing at a replacement.

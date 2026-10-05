---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer reads the Product's About reading
    kind: actor
    actor: developer
    entities:
      - { entity: product, effect: reads, facts: [Identity, Catalog identity, Limitations] }
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer selects Coverage to read what the model covers, by path
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads, facts: [Coverage, Method] }
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer selects References to read every attached location and the resources that cite it
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer opens a Capability and reads its Overview
    kind: actor
    actor: developer
    entities:
      - { entity: capability, effect: reads, facts: [Purpose, Availability, Domain] }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Developer selects Scenarios to read one of its Scenarios' Steps
    kind: actor
    actor: developer
    entities:
      - { entity: capability-scenario, effect: reads, facts: [Trigger and outcome, Steps] }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Developer selects Connections to read everything the Capability relates to
    kind: actor
    actor: developer
    entities:
      - { entity: capability, effect: reads, facts: [Availability, Domain] }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Developer selects References to read the attachments of the resource being read
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Developer opens a Screen that delivers it and reads its presented facts and available Capabilities
    kind: actor
    actor: developer
    entities:
      - { entity: screen, effect: reads, facts: [Exposure, Presents] }
    contexts:
      local:
        place: local-report-web::resource-reading
---

# Read the Product and one resource through their readings

## Trigger

The Developer wants to understand the Product as a whole, then one Capability
and a place that delivers it, without leaving the report.

## Outcome

Each reading answers one question about the resource on screen — what it is,
how much is covered, what is attached, what it does, what it relates to, and
what a place that delivers it presents and makes available. Resource inspection
preserves the working view.

## Edge cases

- A reading with nothing to show is not offered: References appears only where attachments exist, Scenarios only on a Capability or Journey.
- The Product's References and a resource's own References are separate readings; opening a citing resource from the Product's keeps the Product reading underneath.

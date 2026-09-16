---
domain: model-inspection
availability: [{ place: local-report-web }]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/utils/productTopologyViews.ts#PRODUCT_TOPOLOGY_VIEWS
    title: The named views
---

# Explore Product structure and connections

Presents the model’s structure and connections through named readings. Every
collection is one set with two drawings: Rows lists it, and Graph draws it —
Entity relationships for Entities, the Interface map for Interfaces, and a reach
tree from the Product for Domains, Capabilities, Journeys and Business Rules.
The filters narrow the set, and either drawing shows what is left. The three
readings that compare two collections at once — Compare delivery, What changes
what and Rule attachments — are rail rows of their own, below Overview. There is no view of the
whole model: the rail names every collection with its count, and a resource's
own connections belong to its page. Each Graph states the question it answers
and explains its derivation. The Developer can expand branches, narrow the
visible resources, inspect a resource’s incoming and outgoing connections, and
open any included resource’s reading. The selected drawing survives returning
from a page, reloading, and valid model edits.

## Intent

Give the Developer a readable, accountable answer to a question spanning resource
types, with the scope and supporting relationships available for inspection.

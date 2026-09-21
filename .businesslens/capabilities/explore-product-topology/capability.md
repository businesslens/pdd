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
collection is one set with shared drawings: Rows lists it, and Graph draws it —
Entity relationships for Entities, the Interface map for Interfaces, and a reach
tree from the Product for Domains, Capabilities, Journeys and Business Rules.
Matrix compares the same filtered subjects: What changes what in Entities,
Compare delivery in Capabilities, and Rule attachments in Business Rules.
Collection filters, selections and counts stay the same across drawings;
Changed by, Available in and Attached to select matching subjects in every
drawing and the Matrix's target columns. Available in groups Interfaces,
Experiences and Screens in one picker, including delivery through descendants;
the Matrix compares the corresponding Interfaces and matching routes. Capabilities
have no separate Screen or Scenario filter. Attached to combines exact targets and
whole resource types in one searchable picker, with OR within the picker and AND
with other filters. Context restrictions and inherited reach are not attachments.
With no relationship selection, subjects without relationships remain visible. The rail lists Overview and the six collections.
There is no view of the
whole model: the rail names every collection with its count, and a resource's
own connections belong to its page. Each Graph states the question it answers
and explains its derivation. The Developer can expand branches, narrow the
visible resources, inspect a resource’s incoming and outgoing connections, and
open any included resource’s reading. The selected drawing survives returning
from a page, reloading, and valid model edits.

## Intent

Give the Developer a readable, accountable answer to a question spanning resource
types, with the scope and supporting relationships available for inspection.

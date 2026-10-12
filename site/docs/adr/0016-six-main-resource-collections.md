# Six main resource collections

read_when: changing the homepage resource cards, docs topics, or report navigation.

Supersedes the eight equal primary cards and four-column grid in
[ADR-0015](./0015-eight-resource-types-and-acting-is-a-facet-of-entity.md).
Actor remains a facet of Entity; all formal resource types retain their meaning.

## Decision

Teach Entities, Interfaces, Domains, Capabilities, Journeys, and Business Rules
as six main resource collections. The homepage uses two rows of three. Interfaces
introduces Experiences and Screens; Capabilities and Journeys introduce their
own Scenarios. Product describes the whole and is presented in Overview.

The report reaches Experience and Screen instances through their owning
Interface. Documentation explains both types as sections of the Interfaces
document, including their definitions, examples and lint rules. The existing
documentation navigation is retained, with no separate or nested Experiences
and Screens entries.

Independent collections answer independent Product questions. Mandatory child
resources are reached through their owner. Journeys express goals that can cross
Capabilities, Domains and Interfaces, so they retain their own collection.
Visualizations belong to their subject collections; contextual links open those
same readings with a focus. This reduces competing starting points while keeping
resource identities and direct access intact.

## Consequences

The authored folder and portable report schema do not change. Domains remain
classification rather than containment. The docs schema and navigation components
remain unchanged. Public vocabulary stays defined once on the owning PDD docs
pages, with Experience and Screen terms linking to Interfaces sections.
The shared report layer supplies the same
resource placement to the catalog and CLI hosts.

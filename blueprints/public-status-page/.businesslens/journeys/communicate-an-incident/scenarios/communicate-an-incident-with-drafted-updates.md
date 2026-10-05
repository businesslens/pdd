---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Operator declares the incident with a first message
    kind: actor
    actor: operator
    capability: declare-incident
    entities:
      - { entity: incident, effect: creates, to: Investigating, facts: [Title, Impact, Affected components, Started at] }
      - { entity: incident-update, as: first-update, effect: creates, to: Posted, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product opens the incident's workspace
    kind: product
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator writes notes and asks for a draft
    kind: actor
    actor: operator
    capability: draft-incident-update
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product asks a language model to draft the next incident update from the notes
    kind: product
    actor: operator
    capability: draft-incident-update
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact, Affected components] }
      - { entity: incident-update, as: drafted-update, effect: creates, to: Draft, facts: [Message, Notes] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator edits the draft and posts it as Identified
    kind: actor
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: incident-update, as: drafted-update, from: Draft, to: Posted, facts: [Message, Incident status, Posted at] }
      - { entity: incident, from: Investigating, to: Identified, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product emails the incident update to every confirmed subscription
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, as: drafted-update, effect: reads, facts: [Message] }
  - text: The Operator posts a final incident update resolving the incident
    kind: actor
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: incident-update, as: final-update, effect: creates, to: Posted, facts: [Message, Incident status, Posted at] }
      - { entity: incident, from: Identified, to: Resolved, facts: [Resolved at] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product returns the affected components to Operational
    kind: product
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: component, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Communicate an incident with drafted updates

## Trigger

The Operator learns of a problem visitors may notice and wants help writing as it unfolds.

## Outcome

The Journey goal is achieved: the incident went from declared to resolved on the public page, every update on its timeline was one the Operator posted, and the drafted update went out only after the Operator edited and posted it.

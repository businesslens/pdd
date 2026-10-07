---
kind: edge
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
      - { entity: incident-update, as: first-update, effect: creates, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product opens the incident's workspace
    kind: product
    actor: operator
    capability: declare-incident
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator asks for a draft and none can be prepared
    kind: actor
    actor: operator
    capability: draft-incident-update
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator writes the final message and posts it as Resolved
    kind: actor
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: incident-update, as: final-update, effect: creates, facts: [Message, Incident status, Posted at] }
      - { entity: incident, from: Investigating, to: Resolved, facts: [Resolved at] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product emails the final incident update to every confirmed subscription
    kind: product
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, as: final-update, effect: reads, facts: [Message] }
---

# Communicate an incident without a draft

## Trigger

The Operator declares an incident while the language model the Product queries for drafts is unavailable.

## Outcome

The Journey goal is achieved: the Operator wrote and posted every update themselves, and the incident was resolved on the public page.

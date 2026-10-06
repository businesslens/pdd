---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Visitor subscribes with an email address
    kind: actor
    actor: visitor
    capability: subscribe-to-updates
    entities:
      - { entity: subscription, effect: creates, to: Pending, facts: [Email address, Subscribed at] }
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The Visitor follows the confirmation link
    kind: actor
    actor: visitor
    capability: subscribe-to-updates
    entities:
      - { entity: subscription, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: An Operator posts an incident update
    kind: actor
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: incident-update, effect: creates, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product emails the incident update, with a link to the incident, to every confirmed subscription
    kind: product
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, effect: reads, facts: [Message] }
      - { entity: incident, effect: reads, facts: [Title] }
  - text: The Visitor follows the link in the email to the incident
    kind: actor
    actor: visitor
    capability: view-status-page
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
  - text: The Product shows the incident's timeline with the new incident update
    kind: product
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
      - { entity: incident-update, effect: reads, facts: [Message, Posted at] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
---

# Receive an update by email

## Trigger

A Visitor who checked the page during a problem wants to be told when anything changes.

## Outcome

The Journey goal is achieved: the confirmed address received the posted update and its link brought the Visitor to the incident's timeline.

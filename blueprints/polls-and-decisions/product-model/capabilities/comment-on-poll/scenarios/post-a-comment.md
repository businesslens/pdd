---
kind: primary
routes:
  web: Web
steps:
  - text: The Member writes an argument on an open poll
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member posts the comment
    kind: actor
    actor: member
    entities:
      - { entity: comment, effect: creates, facts: [Text, Posted at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the comment in the discussion with the Member's display name
    kind: product
    actor: member
    entities:
      - { entity: comment, effect: reads, facts: [Text, Posted at] }
      - { entity: member, effect: reads, facts: [Display name] }
    contexts:
      web:
        place: polls-web::poll
---

# Post a comment

## Trigger

A Member wants the team to hear why they favor an option.

## Outcome

Every Member reading the poll sees the comment, under its author's name, in the
order comments were posted.

## Edge cases

- The poll's ballot is anonymous → the comment still shows its author's name; only votes are anonymous.
- The comment is empty → nothing is posted.

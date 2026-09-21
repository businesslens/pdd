---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-next: Mobile (next)
steps:
  - text: The Reader narrows the unread items to one source and a span of publication dates
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [Published at] }
      - { entity: source, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
  - text: The Product presents only the unread items that match
    kind: product
    actor: reader
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
  - text: The unread count still counts the whole backlog, and no item's reading state changes
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
---

# Narrow the backlog by source and date

## Trigger

The Reader wants to work through one source's recent items before the rest.

## Outcome

The Reader sees only the unread items from the chosen source in the chosen
span, and the backlog itself is unchanged.

## Edge cases

- No unread item matches → the Reader is told that nothing in the backlog matches, and the narrowing stays available to change.

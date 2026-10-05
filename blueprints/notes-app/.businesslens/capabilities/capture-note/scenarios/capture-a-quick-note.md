---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner writes a few words in the inbox, with or without a title
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
  - text: The Owner chooses to keep it
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
  - text: The Product creates an unsorted note, titled by its first line when no title was given
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: creates, to: Unsorted, facts: [Title, Body, Created at, Last edited] }
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
  - text: The new note is at the top of the inbox
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Created at] }
    contexts:
      web:
        place: notes-web::inbox
      mobile:
        place: notes-mobile::inbox
---

# Capture a quick note

## Trigger

The Owner has a thought they want to keep before it is gone.

## Outcome

A new unsorted note holds what the Owner wrote and is waiting at the top of
the inbox, in no notebook and with no tags.

---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner opens the share link of a deck another Learner shared
    kind: actor
    actor: learner
    entities:
      - { entity: deck, as: original, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Product presents the deck's name and its cards' fronts and backs
    kind: product
    actor: learner
    entities:
      - { entity: deck, as: original, effect: reads, facts: [Name] }
      - { entity: card, as: original-card, effect: reads, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Learner copies the deck
    kind: actor
    actor: learner
    entities:
      - { entity: deck, as: copy, effect: creates, to: Private, facts: [Name, Copied from] }
      - { entity: card, as: copied-card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Product opens the copy among the Learner's own decks, every card in it new and due today
    kind: product
    actor: learner
    entities:
      - { entity: deck, as: copy, effect: reads, facts: [Name, Copied from] }
      - { entity: card, as: copied-card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Copy a shared deck

## Trigger

The Learner opens a share link and chooses to copy the deck it presents.

## Outcome

The Learner owns a private copy with the same name and cards, naming the deck
it was copied from. Its cards start new, and later changes to the original do
not reach it.

## Edge cases

- The Learner opens the share link of a deck they own → it presents the deck as anyone else sees it, and copying it gives them a separate copy.

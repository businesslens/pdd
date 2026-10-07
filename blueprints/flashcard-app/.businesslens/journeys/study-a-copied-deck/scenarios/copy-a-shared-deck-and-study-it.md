---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Learner opens the share link of a deck another Learner shared
    kind: actor
    actor: learner
    capability: copy-deck
    entities:
      - { entity: deck, as: original, effect: reads, facts: [Name] }
      - { entity: card, as: original-card, effect: reads, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Learner copies the deck
    kind: actor
    actor: learner
    capability: copy-deck
    entities:
      - { entity: deck, as: copy, effect: creates, to: Private, facts: [Name, Copied from] }
      - { entity: card, as: copied-card, effect: creates, to: New, facts: [Front, Back, Due on], with: copy }
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Product opens the copy among the Learner's own decks, every card in it new and due today
    kind: product
    actor: learner
    capability: copy-deck
    entities:
      - { entity: deck, as: copy, effect: reads, facts: [Name, Copied from] }
      - { entity: card, as: copied-card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner starts studying the copy
    kind: actor
    actor: learner
    capability: study-deck
    entities:
      - { entity: deck, as: copy, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product presents the front of a copied card
    kind: product
    actor: learner
    capability: study-deck
    entities:
      - { entity: card, as: copied-card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
  - text: The Learner reveals the back and rates their recall Good
    kind: actor
    actor: learner
    capability: study-deck
    entities:
      - { entity: card, as: copied-card, from: New, to: Learning, facts: [Due on, Interval] }
    contexts:
      web:
        place: flashcards-web::study-session
---

# Copy a shared deck and study it

## Trigger

The Learner is handed the share link of a deck they want to learn from.

## Outcome

The Journey goal is achieved: the Learner owns a private copy of the deck, and
the card they rated is learning on their own schedule while the original and
its owner's progress are untouched.

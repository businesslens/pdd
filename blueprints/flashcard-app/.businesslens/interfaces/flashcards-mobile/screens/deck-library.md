---
entities:
  - { entity: deck, shows: [Name] }
  - { entity: card, shows: [Due on] }
entryPoints:
  - flashcards-mobile: flashcards://decks
---

# Deck library

Lists the decks a Learner owns with each deck's progress — how many cards are
new, learning and known, and how many are due today — and starts a study
session for one.

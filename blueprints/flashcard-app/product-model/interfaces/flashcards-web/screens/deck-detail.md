---
entities:
  - { entity: deck, shows: [Name, Share link, Copied from], collects: [Name] }
  - { entity: card, shows: [Front, Back, Due on], collects: [Front, Back] }
entryPoints:
  - flashcards-web: /decks/:deckId
---

# Deck detail

One deck the Learner owns, opened to work in. It presents the deck's cards and
lets the Learner add a card, edit one, or remove one. It shows the deck's
progress — how many cards are new, learning and known, and how many are due
today — and starts a study session. It lets the owner rename the deck, shows
whether it is shared and its share link, lets the owner share it or stop
sharing it, names the deck it was copied from, and lets the owner delete it.

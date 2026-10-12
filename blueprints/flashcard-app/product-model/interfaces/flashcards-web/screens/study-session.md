---
entities:
  - { entity: deck, shows: [Name] }
  - { entity: card, shows: [Front, Back, Due on] }
entryPoints:
  - flashcards-web: /decks/:deckId/study
---

# Study session

Works through the cards one deck has due today, one at a time: the front first,
the back once the Learner has tried to recall it, then the Learner's rating.
When nothing is due it says so and when the next card comes back.

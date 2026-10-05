---
entities:
  - { entity: deck, shows: [Name] }
  - { entity: card-proposal, shows: [Front, Back, Source passage], collects: [Front, Back] }
entryPoints:
  - flashcards-web: /decks/:deckId/proposals
---

# Card proposals

Where a Learner pastes notes and asks for cards for one deck, and
decides on each proposal drafted from them: keep it as drafted or corrected, or discard
it. Each proposal shows the passage of the notes it came from. Proposals not
yet decided wait here until the Learner returns.

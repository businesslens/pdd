---
entities:
  - { entity: deck, shows: [Name] }
  - { entity: card, shows: [Front, Back] }
entryPoints:
  - flashcards-web: /shared/:shareLink
---

# Shared deck

Presents a deck another Learner shared — its name and its cards' fronts and
backs, never its owner's progress — to a signed-in Learner holding its share
link, and lets them copy it into their own library. Once its owner stops
sharing, the link presents nothing.

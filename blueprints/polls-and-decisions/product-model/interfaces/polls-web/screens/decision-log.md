---
entities:
  - { entity: decision, shows: [Outcome, Recorded at] }
  - { entity: poll, shows: [Question] }
entryPoints:
  - polls-web: /decisions
---

# Decision log

Presents every recorded decision of the team, most recent first, with the
question each one settled.

## Intent

Give the team one place to answer "what did we decide?".

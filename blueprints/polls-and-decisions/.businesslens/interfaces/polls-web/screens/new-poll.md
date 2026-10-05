---
entities:
  - { entity: poll, collects: [Question, Options, Choice mode, Deadline, Ballot, Results visibility] }
entryPoints:
  - polls-web: /polls/new
---

# New poll

Where a Member writes a question, its options and the settings that decide how
the poll is voted on and shown, and opens it to the team.

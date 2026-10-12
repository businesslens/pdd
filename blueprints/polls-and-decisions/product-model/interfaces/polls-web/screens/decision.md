---
entities:
  - { entity: decision, shows: [Outcome, Rationale, Final results, Generated draft, Recorded at], collects: [Outcome, Rationale] }
  - { entity: poll, shows: [Question, Tally, Closed at] }
entryPoints:
  - polls-web: /polls/:pollId/decision
---

# Decision

One closed poll's decision. Before it is recorded, only the poll's owner is
here: they write the outcome and rationale, in their own words or edited from a
generated draft marked as generated, beside the question and final results, and
record it; nothing is saved until then. Once recorded, every Member reads the
question it settled, the outcome, the rationale, the final results, when it was
recorded, and whether it began as a generated draft.

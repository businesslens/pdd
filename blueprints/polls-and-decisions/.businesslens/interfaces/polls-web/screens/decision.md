---
entities:
  - { entity: decision, shows: [Outcome, Rationale, Final results, Generated draft, Recorded at], collects: [Outcome, Rationale] }
  - { entity: poll, shows: [Question, Closed at] }
entryPoints:
  - polls-web: /decisions/:decisionId
---

# Decision

One decision record: the question it settled, the outcome, the rationale, the
final results, when it was recorded, and whether it started from a generated
draft. While it is a draft, its poll's owner edits the outcome and
rationale here and records it.

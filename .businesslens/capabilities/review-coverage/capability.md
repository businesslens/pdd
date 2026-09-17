---
domain: model-inspection
availability: [{ place: businesslens-cli }]
references:
  - kind: spec
    role: intent
    target: spec/coverage.md
  - kind: doc
    role: context
    target: docs/cli-coverage.md
---

# Review repository coverage

Captures a repository worklist, accepts an agent's conclusions for exact file
versions, and saves completed accounting in the Coverage document alongside the Product Model. Pending work stays local until completion. A saved
review makes later additions, modifications, deletions and model changes
visible. It establishes which inputs were accounted for, while the agent and
Developer remain responsible for the meaning and sufficiency of the inspection.

## Intent

Let a team explain what its mapping considered and identify later work that
needs investigation, with explicit unknowns and approved scope boundaries.

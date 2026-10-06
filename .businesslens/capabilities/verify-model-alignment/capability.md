---
domain: model-authoring
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: https://github.com/businesslens/pdd/blob/main/skills/businesslens-verify/SKILL.md
    title: businesslens-verify
---

# Verify model alignment

Compares what the model says against what the repository currently does, for a
requested scope — a branch, a named resource, or the whole current product — and
then owns the resolution. Asked to build, it treats everything the model
describes and the code lacks as the plan and builds it slice by slice. Every contract is checked, including what a Step says
it does to a thing and who a Rule says may do it. Each finding is classified by
which side should change, findings that share one decision are grouped, and the
Developer is asked the root question once. Approved model changes are written,
implementation changes are made by the agent the Developer asked to build,
working the Developer's usual way, and every change is followed by a fresh
inspection.

## Intent

One invocation should be enough. A person should not have to notice that a gap
needs new product meaning and then go invoke a different workflow themselves,
and should not have to name this workflow to build: asking the agent to build
from the model is enough.
Current semantic findings are re-derived on every pass: a stored verdict
would survive the code, runtime assumptions, and inspection method that produced
it, and would imply a certainty the next commit has already ended.

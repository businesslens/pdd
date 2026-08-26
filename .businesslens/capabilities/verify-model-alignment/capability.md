---
entities:
  - product-model
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
requested scope — a branch, a named entity, or the whole current product — and
then owns the resolution. Each finding is classified by which side should
change, findings that share one decision are grouped, and the Developer is asked
the root question once. Approved model changes are written, implementation
changes are handed to whatever builder the harness supplies, and every change is
followed by a fresh inspection.

## Intent

One invocation should be enough. A person should not have to notice that a gap
needs new product meaning and then go invoke a different workflow themselves.
Findings are re-derived on every pass and never persisted: a stored verdict
would survive the code, runtime assumptions, and inspection method that produced
it, and would imply a certainty the next commit has already ended.

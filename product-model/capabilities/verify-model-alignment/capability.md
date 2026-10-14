---
domain: model-authoring
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: https://github.com/itai-gendler/pdd-kit/blob/main/skills/pdd-verify/SKILL.md
    title: pdd-verify
---

# Verify model alignment

Compares what the model says against what the repository currently does, for a
requested scope — a branch, a named resource, or the whole current product.
Every contract is checked, including what a Step says it does to a thing and
who a Rule says may do it. Each finding is classified by which side should
change, and findings that share one decision are grouped. A check the
Developer asks for reports every finding first and then resolves the ones the
Developer chooses. Only when the Developer opts in, when installing the
skills, in the repository's agent instructions or in one request, does it also
take over implementation: it treats everything the model describes and the
code lacks as the plan, implements it in phases, and resolves each gap as it
comes. Approved model
changes are written, implementation changes are made by the agent the
Developer asked to implement, working the Developer's usual way, and every
change is followed by a fresh inspection.

## Intent

pdd-kit must not change how anyone implements. Implementing stays the
Developer's own workflow unless the Developer opts in, and a check reports
before it changes anything, so the Developer decides what is worth fixing.
Once a fix is chosen, one invocation should be enough: a person should not
have to notice that a gap needs new product meaning and then go invoke a
different workflow themselves.
Current semantic findings are re-derived on every pass: a stored verdict
would survive the code, runtime assumptions, and inspection method that produced
it, and would imply a certainty the next commit has already ended.

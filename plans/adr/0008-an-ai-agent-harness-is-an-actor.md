# 0008 — An AI agent harness is an Actor

Status: **Accepted** — 2026-08-26

## Context

Three independent mappings of this repository split on one question: is the AI
agent that loads a skill and writes `.businesslens/` an **Actor**, or is it the
runtime the `agent` Interface is delivered through?

Both readings were argued well. For:

- it **initiates** — it loads `SKILL.md`, runs the bundled inventory and linter,
  and decides when to act;
- it holds a **privilege** nobody else has: it is the only participant that
  reads and writes model files;
- the Product must keep an **inbound contract** stable for it — frontmatter
  shape, bundled script paths, `agents/openai.yaml`.

Against, and this is the strongest form of it: *a skill following its protocol
is the Product acting*. On that reading the harness is to an `agent` Interface
what a browser is to a `web` Interface — the runtime, not a participant. No
Scenario Step would ever need to name it.

The direction rule alone does not settle this, because the harness both
initiates and executes. No mechanical test will settle it either. It is a
product decision, and leaving it open costs a whole Actor in every model of
every agent-facing product.

## Decision

**An AI agent harness is an Actor**, and its id is `ai-agent`.

It is an Actor because its responsibility is product-significant in its own
right. What it does with a skill is not fully determined by the person who
invoked it: it chooses what to inspect, what to propose, and when to stop, and
the Product constrains it with guardrails written *at the agent* rather than at
the person. A browser makes no such choices, which is why the browser analogy
does not hold.

The name is `ai-agent`, not `coding-agent`. The harness is not necessarily
coding, and a model of a support product, a research product, or a data product
would name the same participant. The narrower name would have to be corrected
in every such model.

Classify it `kind: system` and `relationship: external`: it is not distributed
by the product it acts on, and it brings its own privileges to the repository.

## Consequences

- A product with an `agent` Interface names `ai-agent` among its Actors.
- Scenario Steps may name it as the responsible Actor where the agent, rather
  than the person, performs the step — inspecting, proposing, resolving.
- This does not make every automated caller an Actor. The direction rule still
  governs: an outbound client the Product calls is a dependency. What
  distinguishes an AI agent is that it *arrives* with latitude of its own.
- Nothing here promotes an internal script or a CI runner to an Actor by
  analogy. A CI runner executing a fixed command has no latitude and remains a
  question the direction rule answers on its own.

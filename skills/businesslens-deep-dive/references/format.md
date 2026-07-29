# BusinessLens deep-dive format

A journey at `journeys/<id>/journey.md` requires:

```yaml
domain: ordering
actors: [shopper]
experiences: [storefront]
features: [checkout]
entryPoints:
  - web: /checkout
codeRefs:
  - src/services/orders.ts#OrderService.submit
```

Each scenario at `journeys/<journey-id>/scenarios/<id>.md` requires:

```markdown
---
kind: primary
businessRules: [stock-must-be-available]
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Scenario title

## Trigger

Concrete initiating condition.

## Steps

1. Observable user or system step.

## Decision points

### Material branch

What product condition changes the result?

- accepted → continue toward the expected outcome
- rejected → preserve state and explain recovery

## Outcome

Observable result.

## Edge cases

- Material variation or recovery behavior.
```

Scenario IDs are globally unique. `kind` must exist in `taxonomies.yaml`.
Each optional decision point has a question and at least two branches.
Compact evidence uses `path[#symbol][:start[-end]]` and must point at
Git-tracked files.

An experience requires `actors`, `access`, `entryPoints`, `exit`, lead prose,
and a `## Capability boundary` section. `access` is `public`,
`authenticated`, or `restricted`.

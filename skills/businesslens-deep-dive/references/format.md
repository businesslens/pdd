# BusinessLens deep-dive format

A journey at `journeys/<id>/journey.md` requires:

```yaml
domain: ordering
actors: [shopper]
experiences: [storefront]
entryPoints:
  - web: /checkout
codeRefs:
  - src/services/orders.ts#OrderService.submit
```

Each scenario at `journeys/<journey-id>/scenarios/<id>.md` requires:

```markdown
---
kind: primary
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Scenario title

## Trigger

Concrete initiating condition.

## Steps

1. Observable user or system step.

## Outcome

Observable result.

## Edge cases

- Material variation or recovery behavior.
```

Scenario IDs are globally unique. `kind` must exist in `taxonomies.yaml`.
Compact evidence uses `path[#symbol][:start[-end]]` and must point at
Git-tracked files.

An experience requires `actors`, `access`, `entryPoints`, `exit`, lead prose,
and a `## Capability boundary` section. `access` is `public`,
`authenticated`, or `restricted`.

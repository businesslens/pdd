---
title: lint
description: Check Product Model structure, relationships, Reference grammar, and tracked code-reference paths without claiming semantic alignment.
section: open-source
group: CLI
order: 30
---

# `businesslens lint`

```bash
npx businesslens lint [--json]
```

Lint is deterministic and read-only. It checks:

- required files, including the orientation README and generated-path
  `.gitignore`, plus frontmatter allowlists, IDs, titles, and behavior sections;
- Actor classifications; required Interface interaction types; Interface and Experience relations, including full
  Interface Actor coverage by Experience contexts; valid
  availability; Capability, Domain, Business Rule, Journey, both Scenario
  types, and taxonomy relationships;
- Capability Scenario ownership, named routes, typed Actor/Product/condition
  Steps, most-specific Context places, and direct coverage for every Capability,
  warning for gaps in `draft` or `partial` and failing them in `complete`;
- a Goal and Success criterion plus achieved multi-Capability Scenario coverage
  for every Journey Actor;
- Journey Scenario results, ordered typed Steps, complete named routes,
  most-specific Context places, route entry Actors, distinct Capability counts, and derived
  Interface/Experience contexts;
- typed Business Rule targets, optional context narrowing, and redundant
  parent/Scenario targets;
- access modes, both Scenario step/decision shapes, and globally unique
  Scenario IDs across both collections;
- strict Reference shape, kinds, roles, targets, and duplicate targets;
- whether present code-reference paths are tracked by Git, and whether local
  non-code targets exist in the tracked repository file set.

Lint validates References only when present. It does not inspect referenced
content, symbols, line existence, runtime behavior, semantic drift, or
implementation completeness. It warns when a local non-code target is not
tracked. A green result means the model is structurally sound—not that model
and code agree. See [References](./references.md) for the full target rules.

Use `businesslens-verify` for semantic alignment.

## JSON output

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "counts": {
    "actors": 2,
    "interfaces": 3,
    "experiences": 2,
    "screens": 1,
    "domains": 2,
    "capabilities": 3,
    "journeys": 2,
    "capabilityScenarios": 4,
    "journeyScenarios": 3,
    "businessRules": 2
  }
}
```

The output contains no branch situation or authority inference.

Exit code `0` means no errors, `1` means lint errors or an unreadable model, and
`2` means invalid usage. Warnings do not fail lint.

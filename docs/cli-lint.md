---
title: lint
description: Check Product Model structure, relationships, Reference grammar, and tracked code-reference paths without claiming semantic alignment.
section: open-source
group: CLI
order: 31
---

# `businesslens lint`

```bash
npx businesslens lint [--json]
```

Lint is deterministic and read-only. It checks:

- required files, including the orientation README and generated-path
  `.gitignore`, plus frontmatter allowlists, IDs, titles, and behavior sections;
- Actor classifications; Interface and Experience relations; exact
  availability; Capability, Domain, Business Rule, Journey, Scenario, and taxonomy
  relationships;
- access modes, scenario step/decision shapes, and globally unique scenario IDs;
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
    "scenarios": 3,
    "businessRules": 2
  }
}
```

The output contains no branch situation or authority inference.

Exit code `0` means no errors, `1` means lint errors or an unreadable model, and
`2` means invalid usage. Warnings do not fail lint.

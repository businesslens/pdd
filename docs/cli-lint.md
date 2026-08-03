---
title: lint
description: Check Product Model structure, relationships, grammar, links, and tracked code-reference paths without claiming semantic alignment.
section: open-source
group: CLI
order: 27
---

# `businesslens lint`

```bash
npx businesslens@latest lint [--json]
```

Lint is deterministic and read-only. It checks:

- required files, frontmatter allowlists, IDs, titles, and behavior sections;
- actor, experience, domain, feature, rule, journey, scenario, and taxonomy
  relationships;
- access modes, scenario step/decision shapes, and globally unique scenario IDs;
- link and codeRef grammar;
- whether present codeRef paths are tracked by Git.

Missing codeRefs are valid at every coverage status because they are optional
navigation. Lint does not inspect symbols, line existence, runtime behavior,
semantic drift, or implementation completeness. A green result means the model
is structurally sound—not that model and code agree.

Use `businesslens-verify` for semantic alignment.

## JSON output

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "counts": {
    "actors": 2,
    "experiences": 2,
    "domains": 2,
    "features": 3,
    "journeys": 2,
    "scenarios": 3,
    "businessRules": 2
  }
}
```

The output contains no branch situation or authority inference.

Exit code `0` means no errors, `1` means lint errors or an unreadable model, and
`2` means invalid usage. Warnings do not fail lint.

`businesslens validate` is refused with exit code 2 and a message naming
`businesslens lint`; it is not an alias.

---
title: Lint in CI
description: Gate Product Model structure in CI without pretending a deterministic linter can prove semantic agreement.
section: open-source
group: Integration
order: 22
---

# Lint the Product Model in CI

```yaml
- name: Lint BusinessLens Product Model
  run: npx businesslens@latest lint
```

This catches malformed files, missing required content, broken relationships,
invalid grammar, and code-reference paths that are not tracked. It is safe and
deterministic, but it is not a semantic gate: it does not prove symbols, lines,
runtime behavior, completeness, or model/code agreement.

Run `businesslens-verify` before merge or release when semantic alignment is
required. The first version intentionally does not persist verification receipts
or expose a semantic CI command, so CI must not infer verification from lint.

For machine-readable structural findings:

```bash
npx businesslens@latest lint --json
```

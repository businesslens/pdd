---
title: CI/CD
description: Gate Product Model structure in CI without pretending a deterministic linter can prove semantic agreement.
section: open-source
group: Integrations
order: 21
---

# Lint the Product Model in CI

```yaml
- name: Lint BusinessLens Product Model
  run: npx businesslens lint
```

This catches malformed files, missing required content, broken relationships,
invalid grammar, Capability Scenario coverage gaps, invalid Journey evidence or
Journey Scenario Steps, and code-reference paths that are not tracked.
It is safe and deterministic, but it is not a semantic gate: it does not prove
symbols, lines, runtime behavior, the truth of authored Product meaning, or
model/code agreement.

Run `businesslens-verify` before merge or release when semantic alignment is
required. Verification findings are re-derived on every run and never persisted:
a tracked ledger would imply durable certainty after the surrounding code or
inspection method changed. There is no semantic CI command, so CI must not infer
verification from lint.

For machine-readable structural findings:

```bash
npx businesslens lint --json
```

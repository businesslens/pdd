---
domain: model-inspection
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/lint.ts#lintModel
    title: Structural rule engine
  - kind: doc
    role: context
    target: https://github.com/businesslens/pdd/blob/main/docs/cli-lint.md
    title: businesslens lint
---

# Lint the Product Model

Checks that a Product Model is structurally sound: that the required files and
sections are there, that identifiers and relationships resolve, that Scenario
routes and Context places are legal, that References are well formed, and that
code-reference paths point at files the repository actually tracks. Findings are
reported as errors that fail the check and warnings that do not, and can be
returned as machine-readable output.

## Intent

Give a repository a deterministic, offline gate that is honest about its own
reach. A clean result proves the model is well formed; it never proves the model
is true, and nothing downstream may read it as agreement between model and code.

---
type: cli
actors: [developer, ai-agent]
entryPoints:
  - cli: pdd-kit
  - cli: pdd-kit blueprint
references:
  - kind: code
    role: implementation
    target: src/cli.ts#createProgram
    title: Command dispatch
---

# pdd-kit command

The supported terminal Interface. It installs and refreshes the agent skills,
checks a Product Model's structure, opens it as a private local report, moves
it between repositories as a Blueprint, lists and pulls published Blueprints,
and proposes a model for publication. An AI agent reaches the same
Interface when a skill asks it for structural findings.

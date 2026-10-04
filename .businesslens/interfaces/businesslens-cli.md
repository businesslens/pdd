---
type: cli
actors: [developer, ai-agent]
entryPoints:
  - cli: businesslens
  - cli: businesslens blueprint
references:
  - kind: code
    role: implementation
    target: src/cli.ts#createProgram
    title: Command dispatch
---

# BusinessLens command

The supported terminal Interface. It installs and refreshes the agent skills,
checks a Product Model's structure, opens it as a private local report, and
moves it between repositories as a Blueprint. An AI agent reaches the same
Interface when a skill asks it for structural findings.

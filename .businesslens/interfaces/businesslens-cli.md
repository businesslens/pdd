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

## Capability boundary

Everything a person or agent asks for by name from a shell: skill distribution,
structural linting, serving the local report, and the whole Blueprint namespace.
It never decides product meaning, never writes product meaning of its own, and
never runs the repository it is pointed at. Deciding what the model should say
belongs to the installed skills, not here.

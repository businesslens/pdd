---
type: cli
actors: [developer, ai-agent]
entryPoints:
  - cli: businesslens
  - cli: businesslens blueprint
  - cli: businesslens coverage
references:
  - kind: code
    role: implementation
    target: src/cli.ts#createProgram
    title: Command dispatch
---

# BusinessLens command

The supported terminal Interface. It installs and refreshes the agent skills,
checks a Product Model's structure, accounts for exact repository inputs, opens
the model as a private local report, and moves it between repositories as a
Blueprint. A Developer or AI agent can record an inspection and compare later
source and model changes through the same Interface.

## Capability boundary

Everything a person or agent asks for by name from a shell: skill distribution,
structural linting, repository accounting, serving the local report, and the whole Blueprint namespace.
It never decides product meaning, never writes product meaning of its own, and
never runs the repository it is pointed at. Deciding what the model should say
belongs to the installed skills, not here.

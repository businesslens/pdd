---
id: businesslens
summary: Keep a product's intended behavior in a Git-tracked Markdown model, install the agent skills that author and check it, and move that model between repositories as a Blueprint.
category: developer-tools
tags: [product-model, coding-agents, developer-tools, specification]
authors:
  - name: BusinessLens
    url: https://businesslens.io
license: MIT
limitations:
  - BusinessLens never implements product behavior. Building is left to whatever plan, spec, or coding flow the harness already provides.
  - Structural linting is deterministic; deciding whether code and model agree is a separate semantic workflow that a person must approve.
  - Analysis never executes the repository it is looking at, so any claim that depends on running the product is out of reach.
  - The Blueprint catalog is a separate service. This product reads it anonymously and proposes changes to it by pull request; it does not operate it.
references:
  - kind: doc
    role: context
    target: https://github.com/businesslens/pdd/blob/main/README.md
    title: Repository README
  - kind: spec
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/spec/format.md
    title: Product Model format contract
  - kind: spec
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/spec/report.md
    title: Product Report contract
---

# BusinessLens

Product-Driven Development for coding agents. BusinessLens keeps what a product
is intended to do — who it serves, what they accomplish, and which rules must
remain true — in a plain-Markdown `.businesslens/` model that lives in the
repository and is reviewed in pull requests. A command-line tool installs the
agent skills that author and check that model, reads it back as a private local
report, and moves it between repositories as a portable Blueprint.

## Intent

Product intent normally survives only in tickets, chat, and the heads of the
people who were there, so a coding agent works from whatever it can infer from
code. BusinessLens gives that intent a durable, diffable home next to the code
it governs, and keeps two claims strictly apart: that the model is well formed,
and that the code currently agrees with it.

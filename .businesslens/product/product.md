---
id: businesslens
summary: Keep intended product behavior in a reviewable model alongside the code.
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

BusinessLens supports Product-Driven Development for coding agents through a
Git-tracked, plain-Markdown `.businesslens/` Product Model. It describes who a
product serves, what they accomplish, the things it keeps and changes, and the
rules governing behavior and permission. Agent skills author the model and
check its agreement with implementation. The command-line tool installs those
skills, checks the model's structure, opens a private local report, and moves
models between repositories as portable Blueprints. It also records which exact
repository inputs an inspection considered and shows later changes to those
files or the model, without treating unchanged inputs as proof of alignment.

## Intent

Give teams and coding agents a durable, reviewable statement of intended
behavior next to the code, so product decisions survive beyond tickets, chat,
and individual memory.

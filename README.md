<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./layers/nuxt/theme/public/brand/logo/mark-dark.svg">
    <img src="./layers/nuxt/theme/public/brand/logo/mark.svg" alt="BusinessLens logo" width="64">
  </picture>
</p>

<h1 align="center">BusinessLens</h1>
<p align="center"><strong>Product-Driven Development for coding agents</strong></p>
<p align="center">Your AI agent is guessing what the product is. Give it, and your team, one Product Model to build from and check against.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/businesslens"><img src="https://img.shields.io/npm/v/businesslens" alt="npm version"></a>
  <a href="https://github.com/businesslens/pdd/actions/workflows/check.yml"><img src="https://github.com/businesslens/pdd/actions/workflows/check.yml/badge.svg" alt="Check"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
</p>

<p align="center">
<code>npx businesslens install</code>
</p>

<p align="center">
  <img src="./.github/demo.gif" alt="A tour of BusinessLens's own Product Model: npx businesslens view businesslens/pdd opens it in the local report, then its Entities, Capabilities, Interfaces and Business Rules, each drawn more than one way" width="800">
</p>

<p align="center">
Try it yourself: <code>npx businesslens view businesslens/pdd</code>
</p>

---

> **BusinessLens** keeps what your product does in a Git-tracked
> `.businesslens/` folder of Markdown files, and gives your coding agent the
> skills to write it, follow it and check the code against it.

## Why a Product Model in the AI era

Agents write code faster than anyone can explain to them what the product is.
They fill the gaps by guessing, and the guesses ship.

1. **One definition.** Not scattered across tickets, docs, chats and people, but one model beside the code.
2. **Agents know what to build.** They read the Journeys, Scenarios and Rules instead of guessing.
3. **Done means it matches the product.** Verify checks the code against the approved model.
4. **Drift is easy to spot.** The model stays a clear reference as behavior changes.
5. **Decisions travel with the code.** Model and code changes are reviewed in one pull request.

**Dogfooded:** BusinessLens is developed with BusinessLens. Its own Product Model
lives in this repository's [`.businesslens/` folder](./.businesslens/), and the
demo above is that model in the local report.

## Features

* 🤖 **Agent skills:** map, ideate and verify for Claude Code, Codex, Cursor, Gemini CLI and GitHub Copilot

* 📝 **Markdown-native:** every resource is a plain `.md` file in your repo, reviewed in pull requests

* ✅ **Lint and verify:** `businesslens lint` checks the files; `businesslens-verify` checks the code against them

* 🔁 **Fits your workflow:** implement with plan mode, an SDD tool or freestyle; BusinessLens never implements for you

* 🖥️ **Local report:** `businesslens view` opens the model in your browser and follows your edits

* 📦 **Blueprints:** start from a reviewed model for a common product instead of a blank page

* 🔒 **Local-first:** no account, no hosted service; the skills read your code and never run it

* 🆓 MIT-licensed and open source

---

## The development loop

<p align="center">
  <img src="./.github/readme/development-loop.svg" alt="The development loop: ideate with /businesslens-ideate, implement in your existing workflow, verify with /businesslens-verify" width="600">
</p>

## <img src="./.github/readme/rocket.svg" alt="" width="28" height="28" align="top"> Getting started

```bash
npx businesslens install
```

Then start from where you are, inside your agent (Codex uses `$` instead of `/`):

| You have | Run | Guide |
| --- | --- | --- |
| Existing code | `/businesslens-map` | [From your repo](./docs/from-your-repo.md) |
| An idea | `/businesslens-ideate` | [From an idea](./docs/from-an-idea.md) |
| A familiar kind of product | `npx businesslens blueprint pull <name>` | [From a Blueprint](./docs/from-a-blueprint.md) |

Then every change runs the loop:

```text
/businesslens-ideate add guest checkout   # approve the model change
                                          # implement in your existing workflow
/businesslens-verify this branch          # fix what disagrees, re-check
```

`map` is for adopting BusinessLens or covering more of the product; `verify` is
the everyday skill.

## <img src="./.github/readme/app-window.svg" alt="" width="28" height="28" align="top"> Web interface

Read the Product Model as a report in your browser. It updates automatically
as you make changes. The server listens on `127.0.0.1` only and sends nothing
anywhere.

```bash
# This repository's model (opens the browser)
npx businesslens view

# A GitHub repository's pull request
npx businesslens view acme/checkout --pr 12

# Custom port, no browser
npx businesslens view --port 8080 --no-open
```

## <img src="./.github/readme/square-terminal.svg" alt="" width="28" height="28" align="top"> CLI reference

Every command and option: [CLI reference](./docs/cli.md).

Quick examples: `businesslens install`, `businesslens update`,
`businesslens lint`, `businesslens view`, `businesslens blueprint export`,
`businesslens blueprint pull <name>`, `businesslens blueprint open <report>`,
`businesslens blueprint contribute`.

Full help: `npx businesslens --help`

## License

BusinessLens is released under the **MIT License**: do anything, just give
credit. See [LICENSE](./LICENSE).

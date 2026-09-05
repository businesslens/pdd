---
title: view
description: Open the current Product Model as a private local report that stays updated while you edit.
section: open-source
group: CLI
order: 31
terms:
  - term: Topology
    anchor: reading-the-report
    definition: "The report's cross-kind canvas, whose named views each answer one fixed question about the whole model."
  - term: Neighbourhood
    anchor: reading-the-report
    definition: "One resource drawn on the Topology canvas with everything that touches it."
---

# `businesslens view`

```bash
npx businesslens view
```

`view` opens the current Product Model as a read-only report on localhost. It
does not alter the model, write `.businesslens/build/report.json`, or send
report data to BusinessLens.

The model must pass structural lint before the viewer opens. While it remains
open, valid changes appear automatically. If an edit introduces a lint error,
the browser keeps the last valid report visible and recovers after the error is
fixed.

## Options

| Option | Effect |
| --- | --- |
| `--no-open` | Print the URL without launching the default browser |
| `--port <port>` | Listen on a specific port from 1 through 65535 |
| `-c, --cwd <path>` | Start model lookup from another directory |

By default, `view` starts from the current directory. If that directory directly
contains `.businesslens/`, that model is used; otherwise BusinessLens checks the
Git repository root. See
[Choosing the Product Model](./cli.md#choosing-the-product-model) to select a
nested Blueprint, another repository, or a standalone model with `--cwd`.

The server listens only on `127.0.0.1` and stops when the command exits.

## Reading the report

The report opens on the Overview, with a rail of the model's resource types
down the side. A row opens that collection, and a card or table row opens the
resource's own page at its own URL. `⌘K` searches every resource in the model
by name.

**Topology** is the single breadth destination: a cross-kind canvas whose named
views each answer one fixed question — which Capabilities a Journey composes,
which Screens expose an ability — rather than a builder that asks you to invent
the question first. **Neighbourhood** is the action a resource page offers into
it, drawing that same canvas around one resource and everything touching it.

Selected Product Model terms have a dotted underline: each opens its one-line
meaning, and **Vocabulary** in the header lets you search the documented terms.
Both link out to the page here that explains the term in full.

Use [`blueprint export`](./cli-export.md) when you need to write a source-free,
portable Product Report.

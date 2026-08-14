---
title: view
description: Open the current Product Model as a private local report that stays updated while you edit.
section: open-source
group: CLI
order: 31
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

## Finding your way around

The left rail lists the entity kinds. Scenarios are read on the Capability or
Journey that owns them, as a second tab on that collection — the format gives
them exactly one parent, so they are not a peer of Actors and Interfaces.

Each collection opens grouped by the containment the model declares: Screens by
Interface, Capabilities by Domain, Scenarios by their parent. The heading states
the question that collection answers and the derivation behind that order.

Selecting a row opens a **peek** — enough to tell you whether it is the entity
you meant, without losing the list. From there, **the page** is the full
reading: everything authored, at full width, at its own address. The section and
the open page live in the URL, so you can send someone a link to one Capability,
walk back out with the browser's back button, and reload without losing your
place.

`⌘K` searches every entity by name and lands on its page. **Topology** answers
fixed cross-kind questions, and any entity's page can send its own
neighbourhood to that canvas.

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

Use [`blueprint export`](./cli-export.md) when you need to write a source-free,
portable Product Report.

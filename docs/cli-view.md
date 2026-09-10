---
title: view
description: Open the current Product Model as a private local report that stays updated while you edit.
section: open-source
group: CLI
order: 28
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

Overview sits above six Resources collections: Entities, Interfaces, Domains,
Capabilities, Journeys, and Business Rules. Experiences and Screens are reached
through Interfaces, which name what they contain on their own rows, and every
resource keeps its own page with an actual ownership trail. Search reaches every
resource directly.

Every surface reads the same way down the page: what it is and the ways out of
it, then which set you are reading, then what narrows it. Tabs are the only
switch — a tab changes which set is on screen, the rail changes the subject, and
the toolbar only narrows what is already there.

| Reading | Where to open it |
| --- | --- |
| Domain map | Domains → Map |
| Interface map | Interfaces → Map |
| Compare delivery | Interfaces → Compare delivery |
| Entity relationships | Entities → Relationships |
| What changes what | Capabilities → What changes what |
| Rule attachments | Business Rules → Attachments |
| Journey composition | Journeys → Composition |
| About, Coverage, Model counts, References | Overview → its own tabs |
| Lifecycle | An Entity → Lifecycle |
| Scenarios | A Capability or Journey → Scenarios |

Each collection starts with List and states the question its open view answers.
Collections that carry an authored Domain group by it; nothing about the
grouping is configurable, and Entities that act lead their collection in a group
of their own. Filters are offered only where scanning would be slower, and only
over relations the rows already print.

The Overview is the Product's own page and reads like every other one: it is
headed `Overview`, the same word as the rail row that opens it, and About,
Coverage, Model counts and References are tabs beside it. It carries no named
view of its own: the rail already lists every collection with its count, and a
resource's connections are on its page. The Product's name and
logo stay in the report header, where they sit on every surface. The Overview
does not list Journeys — they have a rail row, a page and a count of their
own.

A resource page names itself: the trail ends at its parent, and the heading
carries its title, its type, and its ways out — the documentation for its type,
and any named view of another subject focused on this resource. Resource
Overview includes incoming and outgoing Connections and, for an Interface, what
it delivers.

Interface map, Entity relationships, and Lifecycle use interactive graphs with
zoom, pan, and Fit controls. The open section, resource, tab, filters, Scenario
route, and graph viewports survive refresh and browser Back, and valid model
edits retain surviving selections. Lifecycle retains every State and its full
transition reading.

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

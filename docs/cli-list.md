---
title: blueprint list
description: List the published Blueprints you can pull.
section: open-source
group: CLI
order: 27
---

# `pdd-kit blueprint list`

List every published [Blueprint](./from-a-blueprint.md#what-a-blueprint-is) by
the name [`blueprint pull`](./cli-pull.md) takes.

```bash
npx pdd-toolkit blueprint list
```

It takes no options. The list is read from the same release `pull` downloads
from, so a Blueprint appears here within minutes of being merged.

```text
kanban-board   Kanban Board
url-shortener  URL Shortener

Pull one with: npx pdd-toolkit blueprint pull <name>
```

Exits 0 when the list is printed, 1 when the release or the network refuses it,
and 2 for an invalid `PDD_KIT_BLUEPRINT_REPOSITORY`.

## Next

- [`blueprint pull`](./cli-pull.md) one into an empty folder.

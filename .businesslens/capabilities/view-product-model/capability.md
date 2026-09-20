---
domain: model-inspection
availability: [{ place: businesslens-cli }, { place: local-report-web }]
references:
  - kind: code
    role: implementation
    target: src/core/local-viewer-server.ts
    title: Loopback report server
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrReportShell.vue
    title: Report shell
---

# View the Product Model

Serves the current Product Model as a private, read-only report on the
Developer's own machine and keeps it current while they edit. The reader browses
resources by kind, opens any resource’s reading, reads a thing's lifecycle as the
Steps compose it, searches by name, and keeps their place across a save and a
reload.

Review opens on uncommitted Product Model changes since the last commit.
Comparing selected Git versions is an explicit action. Authored model files
form one tree, which can also show other repository changes as path-only context.
The Review header badge counts changed Product Model files.
Selecting a model file exposes its highlighted edits and links to the resource
at either selected version. Coverage in Overview explains current breadth,
exclusions and known gaps directly, with recorded paths linking to related
context and References. Reading never records inspection or changes the repository.

## Intent

A model that is only read as a file diff is read once. This is somewhere to
return to during authoring, so it has to survive a recompile and a refresh, and
it has to stay private: it listens on the loopback address only and sends
nothing anywhere.

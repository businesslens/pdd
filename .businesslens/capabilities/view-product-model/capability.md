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
elements by kind, opens any element's page, searches by name, and keeps their
place across a save and a reload.

## Intent

A model that is only read as a file diff is read once. This is somewhere to
return to during authoring, so it has to survive a recompile and a refresh, and
it has to stay private: it listens on the loopback address only and sends
nothing anywhere.

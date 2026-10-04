---
type: web
actors: [developer]
entryPoints:
  - web: /
  - businesslens-cli: businesslens view
references:
  - kind: doc
    role: context
    target: https://github.com/businesslens/pdd/blob/main/docs/cli-view.md
    title: businesslens view
---

# Local Product Report

The private browser Interface a Developer reads the Product Model in. It is
served from the loopback address by the terminal command, for one reader, with
no account and nothing sent anywhere. It is a place to return to during
authoring rather than a document to read once: the open section, resource, and
Scenario route live in the address bar, so a reading survives a link, the back
button, and a reload.

---
type: web
actors: [developer]
entryPoints:
  - web: /
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

## Capability boundary

Reading: browsing resources by kind, opening any resource's page, searching by
name, and reading the named topology views. It presents what the model already
says and never edits it, never accepts an account, and never publishes or
transmits the report. It shows the model, not the code — it makes no claim about
whether the repository agrees with what it displays.

---
id: bookmark-manager
summary: A private library of links you save yourself, from browser, phone or a browser's export, filed and tagged, with your own AI agent suggesting tidying.
category: productivity
tags: [single-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A library belongs to one person. There is no sharing, public collection, or collaboration.
  - Import reads a bookmarks file exported from a browser. Nothing stays in sync with a browser, and nothing is exported back to one.
  - The Product keeps links, not copies of pages. It does not archive page contents or check whether a link still works.
  - Tags are never renamed. A tag is removed when the last bookmark carrying it loses it.
  - The Owner signs in with an existing account; signing up and managing accounts are not part of this product.
  - Bring your own AI agent; the Product does not include one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/bookmark-manager/references/assumptions.md
    title: Bookmark assumptions
---

# Bookmark Manager

A personal library of links. The Owner saves a page from the browser or from
any app on their phone, files it into a collection, gives it tags and a note,
and finds it again by searching or browsing. Bookmarks kept in a browser come
in from an export file, and an AI agent the Owner connects can classify them,
find the pages kept twice, and propose collections.

## Intent

Links worth keeping get lost in open tabs, chats and half-remembered searches,
and a browser's bookmarks bar fills up faster than anyone files it. Make
keeping a link cheaper than losing it, and finding it again faster than
searching the web for it twice. The library is the Owner's alone: their AI
agent reads it and suggests collections, tags and merges, and nothing changes
until the Owner accepts.

---
id: bookmark-manager
summary: Save links from the web or your phone, file them into collections and tags, find them again, and import a browser's bookmarks, with an assistant that suggests how to tidy them for you to approve.
category: personal-productivity
tags: [single-user, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A library belongs to one person. There is no sharing, public collection, or collaboration.
  - Import reads a bookmarks file exported from a browser. Nothing stays in sync with a browser, and nothing is exported back to one.
  - The assistant judges from what the library keeps — titles, addresses, notes, tags and the browser folders bookmarks came from — not from the pages themselves, so a suggestion can be wrong. Nothing changes until the Owner accepts it.
  - The Product keeps links, not copies of pages. It does not archive page contents or check whether a link still works.
  - Collections, import and the assistant's suggestions are on the web; the mobile application saves, finds, edits and deletes bookmarks.
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
in from an export file, and an assistant suggests how to file them and which
ones are the same page saved twice.

## Intent

Make keeping a link cheaper than losing it, and finding it again faster than
searching the web for it twice. The library is the Owner's alone: the
assistant reads it to suggest collections, tags and merges, and every change
it suggests waits for the Owner to accept it, so nothing is filed, merged or
deleted behind their back.

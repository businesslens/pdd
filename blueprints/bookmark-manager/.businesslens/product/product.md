---
id: bookmark-manager
summary: Save links from the web or your phone, file them into collections and tags, find them again, and import a browser's bookmarks, with an AI agent you connect suggesting how to tidy them for you to approve.
category: personal-productivity
tags: [single-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A library belongs to one person. There is no sharing, public collection, or collaboration.
  - Import reads a bookmarks file exported from a browser. Nothing stays in sync with a browser, and nothing is exported back to one.
  - The AI agent judges from what the library keeps — titles, addresses, notes, tags and the browser folders bookmarks came from — so a suggestion can be wrong. It only suggests; nothing changes until the Owner accepts.
  - Which AI agent the Owner connects, and how it proves it acts for them, are outside the model.
  - The Product keeps links, not copies of pages. It does not archive page contents or check whether a link still works.
  - Collections, import and deciding suggestions are on the web; the mobile application saves, finds, edits and deletes bookmarks.
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

Make keeping a link cheaper than losing it, and finding it again faster than
searching the web for it twice. The library is the Owner's alone: their AI
agent reads it and leaves suggestions for collections, tags and merges, and
every change it suggests waits for the Owner to accept it, so nothing is filed,
merged or deleted behind their back.

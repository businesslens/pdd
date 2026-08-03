---
actors:
  - collection-owner
  - collection-subscriber
  - reader
interfaces:
  - reader-web
  - reader-mobile
access: authenticated
entryPoints:
  - reader-web: /
  - reader-web: /unread
  - reader-web: /saved
  - reader-web: /search
  - reader-web: /sources
  - reader-web: /collections
  - reader-mobile: content-reader://library
---

# Reading application

The one surface a reader works in. It shows the unread backlog, the full
library, the sources behind it, saved items and their tags, search across
everything fetched, and the collections the reader owns or subscribes to.

## Capability boundary

Requires a session; every view is scoped to the signed-in reader's own library.
A reader can follow and unfollow sources, trigger a refresh, read items and
change their read state, save and unsave items, tag saved items, search, create
and edit their own collections, publish or unlist them, and subscribe to
collections others published.

A reader can also change their display name here. It is the only thing about
them anyone else ever sees — it appears on the collections they publish — so it
belongs on the surface they already work in rather than behind a settings area
this product does not otherwise need.

A reader cannot see another reader's library, sources, reading state, or
unpublished collections, and cannot modify a collection they do not own — a
subscribed collection is read-only here in exactly the way it is for a visitor.
There is no administrative capability: no reader manages another account, and
there is no moderation of published collections on this surface.

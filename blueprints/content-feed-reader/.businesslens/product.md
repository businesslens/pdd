---
id: content-feed-reader
tags:
  - content
  - curation
  - reading
  - syndication
limitations:
  - Full-text search covers item titles and body text the product fetched; it does not follow links out to the original page.
  - Sharing is one-directional. A subscriber reads a collection; there is no commenting, reply, or co-editing.
  - The product reads syndicated content. It does not publish feeds of its own.
---

# Content & Feed Reader

A reading product for people who follow more sources than they can keep up with.
It collects syndicated content into one library, keeps track of what has been
read, lets a reader save and tag the things worth keeping, and makes those
things findable again months later. Readers can gather saved items into
collections and share a collection with others.

## Intent

External feeds are unreliable in ways their readers should never have to think
about. Sources go down, change their addresses, republish old items with new
identifiers, and occasionally serve nonsense. A reader's own library — what they
follow, what they have read, and what they chose to keep — is the durable thing,
and it must survive every one of those failures.

The product therefore treats the library as authoritative and the network as
advisory. Nothing a source does can remove an item a reader saved, reset reading
state, or empty a library. A source that breaks is reported as broken and kept,
not silently dropped.

Sharing exists because the reader who curates a good collection is usually not
the only person who wants it. Sharing is deliberately shallow: a collection is
published or it is not, and a subscriber reads it. Everything that would turn
this into a social product — replies, co-editing, follower graphs — is out of
scope, because it would make the reading product answerable to other people's
behavior.

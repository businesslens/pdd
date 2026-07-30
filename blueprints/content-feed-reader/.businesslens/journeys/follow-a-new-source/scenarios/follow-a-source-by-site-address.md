---
kind: primary
---

# A reader follows a source by pasting a site address

## Trigger

A reader submits the address of a web page rather than of a feed.

## Steps

1. The product fetches the page and looks for feeds it advertises
2. One feed is found, or the reader chooses between several
3. The chosen feed is followed exactly as if its address had been submitted directly

## Decision points

### Feeds advertised by the page

How many feeds does the page advertise?

- exactly one → follow it without asking
- several → present them with their titles and let the reader choose
- none → refuse the address and explain that no feed was found there

## Outcome

The reader follows the feed behind the site they pasted, without having had to
find its address themselves.

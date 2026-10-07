---
availability: [{ place: bookmarks-web }]
references:
  - kind: spec
    role: context
    target: https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa753582(v=vs.85)
    title: Netscape bookmark file format
---

# Bookmark import

Reads a bookmarks file exported from a browser and adds each bookmark whose
address the library does not already keep, as Unsorted, remembering the browser
folder it came from. It then opens the Library on the Unsorted bookmarks it
added.

## Intent

Bring years of browser bookmarks in at once without filing decisions up front,
and leave the filing to the Owner, by hand or by accepting their AI agent's
suggestions.

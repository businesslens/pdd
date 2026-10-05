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
address the library does not already keep, as Unsorted, remembering the
browser folder it came from. It then passes the added bookmarks to the
assistant and takes the Owner to Suggestions.

## Intent

Bring years of browser bookmarks in at once without filing decisions up front,
and leave the filing to suggestions the Owner decides.

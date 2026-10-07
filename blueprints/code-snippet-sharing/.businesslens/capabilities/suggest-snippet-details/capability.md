---
domain: my-snippets
availability: [{ place: snippets-web::workspace }]
---

# Snippet detail suggestion

When the Developer asks for suggested details in the editor, the Product sends
the code and its language to a language model and fills the title, description
and tags fields with what it drafts. The language model is called only on that
request, and never drafts code, a language or a visibility. The filled fields
stay editable, and saving the snippet is what keeps them.

## Intent

Make describing a snippet the easy step instead of the skipped one. The
language model is a helper whose absence costs only the suggestion, never the
ability to write and save.

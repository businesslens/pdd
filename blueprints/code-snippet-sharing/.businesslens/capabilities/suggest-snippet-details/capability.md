---
domain: my-snippets
availability: [{ place: snippets-web::workspace }]
---

# Suggested details

When the Developer asks for suggested details in the editor, the Product sends
the code and its language to a language model and shows the title, description
and tags it drafts as a suggestion, which the Developer accepts or dismisses.
The language model is called only on that request. Accepted values fill the
editor's fields; only saving keeps them.

## Intent

Make describing a snippet the easy step instead of the skipped one, while the
words that are kept stay the Developer's choice. The language model is a helper
whose absence costs only the suggestion, never the ability to write and save.

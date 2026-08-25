# Content Feed Reader screen map

This supporting UX map groups Product Screens by Experience. The Product Model
owns their purpose and behavior; this diagram shows likely navigation without
becoming a second contract.

```mermaid
flowchart TD
  subgraph library[Personal library — web and mobile]
    sources[Source list]
    unread[Unread library]
    collections[Collection workspace]
  end

  subgraph public[Public reading — web]
    shared[Public collection]
  end

  sources --> unread
  unread --> collections
  collections --> shared
```

The arrows show common reachability, not required Journey steps. Journeys and
Scenarios remain the acceptance contract.

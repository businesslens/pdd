# Content Feed Reader screen map

This supporting UX map groups Product Screens by Experience and shows where
they nest. The Product Model owns their purpose, facts and behavior; this
diagram is a reading aid, not a second contract.

```mermaid
flowchart TD
  subgraph web[Reader web]
    reader[Item reader — shared]
    subgraph library[Personal library]
      unread[Unread library]
      saved[Saved items]
      search[Search]
      subgraph sources[Source list]
        detail[Source detail]
      end
      subgraph add[Add source — wizard]
        address[Feed address] --> confirm[Confirm]
      end
      subgraph workspace[Collection workspace]
        items[Items]
        subgraph settings[Settings]
          sharing[Sharing]
        end
      end
    end
    subgraph public[Public reading]
      shared[Public collection]
    end
  end

  subgraph mobile[Reader mobile]
    msearch[Search — shared, always reachable]
    subgraph classic[Personal library — classic]
      cunread[Unread library]
      csaved[Saved items]
      csources[Source list]
    end
    subgraph alternative[Source-focused library — concurrent alternative]
      nunread[Unread library]
      bysource[Source backlog — always reachable]
      nsaved[Saved items]
      nsources[Source list]
    end
  end
```

Frames are containment; a wizard's arrow is its order. Movement between
Screens is recorded by Scenario Steps; this reference shows containment.

Both mobile Experiences are current alternatives in the Library layout Variation
(`variations/library-layout.md`), chosen by the Reader's Library assignment.
Neither Experience's file names the other or inherits content from it.

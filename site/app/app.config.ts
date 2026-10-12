export default defineAppConfig({
  ui: {
    /**
     * A Blueprint page renders the report viewer's dashboard group under the
     * site header, so the group can no longer own the viewport with
     * `fixed inset-0` — it would draw the sidebar over that header. It becomes
     * a flex child instead, and the sidebar and panels fill the remaining row
     * rather than each demanding a full `100svh`.
     */
    dashboardGroup: {
      base: 'static inset-auto min-h-0 flex-1'
    },
    dashboardSidebar: {
      slots: { root: 'min-h-0' }
    },
    dashboardPanel: {
      slots: { root: 'min-h-0' }
    },
    prose: {
      table: {
        slots: {
          root: 'content-table-frame rounded-xl',
          base: 'content-table border-collapse rounded-none'
        }
      },
      pre: {
        /**
         * Scroll long lines instead of wrapping them.
         *
         * Nuxt UI ships `whitespace-pre-wrap wrap-break-word` on prose `<pre>`,
         * which is reasonable for code and destructive for anything whose
         * meaning is in its column positions. The repository's `docs/index.md` draws the
         * verify loop as an ASCII figure, and at phone widths every line of it
         * wrapped — the arrows landed under the wrong boxes and the diagram
         * became unreadable.
         *
         * The fix belongs here rather than in the diagram. Those docs are
         * rendered from `itai-gendler/pdd-kit` and are also read on GitHub, which
         * uses `white-space: pre` with a horizontal scroll; narrowing the
         * figure to survive a 390px wrap would have degraded the surface that
         * was already correct.
         *
         * The trade is that a long command now scrolls on a phone rather than
         * wrapping. That is the same behaviour GitHub gives it, which is worth
         * more than saved scrolling when one file has to read correctly in both
         * places. `overflow-x-auto` is already in the theme, so the scroll
         * container exists.
         */
        slots: {
          base: 'whitespace-pre wrap-normal'
        }
      }
    }
  }
})

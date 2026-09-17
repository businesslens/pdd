const SUBJECT_WIDTH = 196
const MIN_COLUMN_WIDTH = 180

/** Whole-column windows share the available width; the final window stays full. */
export function matrixColumnWindow(width: number, count: number, anchor: number) {
  const available = Math.max(1, width - 2 - SUBJECT_WIDTH)
  const capacity = Math.max(1, Math.min(count, Math.floor(available / MIN_COLUMN_WIDTH)))
  const lastStart = Math.max(0, count - capacity)
  const start = Math.max(0, Math.min(lastStart, anchor))
  const columnWidth = available / capacity
  return {
    capacity,
    renderStart: Math.max(0, start - 1),
    renderEnd: Math.min(count, start + capacity + 1),
    start,
    end: Math.min(count, start + capacity),
    previous: start > 0 ? start - 1 : null,
    next: start < lastStart ? start + 1 : null,
    subjectWidth: SUBJECT_WIDTH,
    columnWidth,
    tableWidth: SUBJECT_WIDTH + count * columnWidth,
    offset: start * columnWidth
  }
}

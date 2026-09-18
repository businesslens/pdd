import { describe, expect, it } from 'vitest'
import { matrixColumnWindow } from '../layers/nuxt/report-viewer/app/utils/matrixColumnWindow.js'

describe('matrix column navigation', () => {
  it('fits whole columns beside the fixed subject column at every width', () => {
    for (const width of [280, 320, 390, 640, 768, 1000, 1640]) {
      for (const count of [1, 3, 9, 12, 40]) {
        const page = matrixColumnWindow(width, count, 0)
        expect(page.subjectWidth).toBe(196)
        expect(page.subjectWidth + page.capacity * page.columnWidth + 2).toBeCloseTo(width)
        expect(page.capacity).toBeLessThanOrEqual(count)
        expect(page.end).toBe(page.capacity)
      }
    }
  })

  it('advances one column at a time and reverses through the same windows to the start', () => {
    const visited: number[] = []
    const starts: number[] = []
    let page = matrixColumnWindow(1100, 12, 0)
    while (true) {
      starts.push(page.start)
      for (let index = page.start; index < page.end; index++) visited.push(index)
      if (page.next === null) break
      page = matrixColumnWindow(1100, 12, page.next)
    }
    expect([...new Set(visited)]).toEqual(Array.from({ length: 12 }, (_, index) => index))
    expect(starts).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    const reverse = [page.start]
    while (page.previous !== null) {
      page = matrixColumnWindow(1100, 12, page.previous)
      reverse.push(page.start)
    }
    expect(reverse).toEqual([...starts].reverse())
  })

  it('bounds mounted body columns to the visible window and one neighbour per side', () => {
    for (const count of [1, 9, 200]) for (const width of [390, 1100, 1640]) {
      for (let anchor = 0; anchor < count; anchor++) {
        const page = matrixColumnWindow(width, count, anchor)
        expect(page.renderStart).toBeGreaterThanOrEqual(0)
        expect(page.renderStart).toBeLessThanOrEqual(page.start)
        expect(page.renderEnd).toBeGreaterThanOrEqual(page.end)
        expect(page.renderEnd).toBeLessThanOrEqual(count)
        expect(page.renderEnd - page.renderStart).toBeLessThanOrEqual(page.capacity + 2)
        for (const adjacent of [page.previous, page.next]) {
          if (adjacent === null) continue
          const neighbour = matrixColumnWindow(width, count, adjacent)
          expect(page.renderStart).toBeLessThanOrEqual(neighbour.start)
          expect(page.renderEnd).toBeGreaterThanOrEqual(neighbour.end)
        }
      }
    }
  })

  it('clamps removed or resized anchors and disables navigation when everything fits', () => {
    expect(matrixColumnWindow(1000, 0, -1)).toMatchObject({ start: 0, end: 0, previous: null, next: null })
    expect(matrixColumnWindow(1000, 3, 2)).toMatchObject({ start: 0, end: 3, previous: null, next: null })
    expect(matrixColumnWindow(390, 12, 7)).toMatchObject({ start: 7, end: 8, previous: 6, next: 8 })
    expect(matrixColumnWindow(1640, 12, 7)).toMatchObject({ start: 4, end: 12, previous: 3, next: null })
    expect(matrixColumnWindow(640, 3, 99)).toMatchObject({ start: 1, end: 3, previous: 0, next: null })
  })
})

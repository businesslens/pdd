<script setup lang="ts">
/**
 * The ring the three phases sit around: a circle with a curl between
 * Implement and Verify, nine ticks, two arrows showing the direction of travel,
 * and one dot riding it clockwise — through the curl, back toward Implement,
 * before it goes on to Verify.
 *
 * Decorative in full, and `aria-hidden` because of it. Every word it appears to
 * carry is really rendered as text by `LoopPanel` beside it — a screen reader
 * gets three headings in loop order and none of this.
 *
 * **The orbit is CSS, not `motion-v`.** `offset-path` hands the whole animation
 * to the compositor: no JavaScript runs per frame, nothing hydrates, and the
 * dot is already moving before Vue has mounted. The library earns its place
 * elsewhere on this page for enter transitions that have to know about scroll
 * position; an unconditional 22-second loop is precisely the case it does not.
 * Reach for it here only if the dot ever has to track something — scroll
 * progress, or a phase the reader has selected.
 */
const { label, mark, phases = [] } = defineProps<{
  /** The first line inside the ring. Uppercased by CSS, so store it cased. */
  label: string
  /** The second, set identically — the two are one signature, not a pairing. */
  mark: string
  /**
   * The station names, clockwise from twelve o'clock — the same order and the
   * same source as the headings `LoopPanel` renders beside the figure.
   *
   * Drawn only where the figure has to stand on its own. From `md` up each
   * phase already sits in the grid cell its tick points at, so a name on the
   * ring would be the second copy of a word six inches from the first; below
   * `md` there are no such cells, and a ring with three unlabelled ticks is a
   * clock. The switch is CSS and belongs to the arrangement that needs it — see
   * `.loop-wheel-phase` below.
   *
   * Still decorative, and still inside the `aria-hidden` wrapper. A screen
   * reader gets the three `h3`s and none of this; that is what keeps the ring
   * from announcing the loop twice.
   */
  phases?: string[]
}>()

/**
 * Ring radius and the tick span either side of it, in viewBox units on a
 * 100×100 canvas. Everything else on the wheel is derived from these, so the
 * ring, the marks along it and the path the dot rides cannot drift apart.
 */
const RADIUS = 46
const TICK_OUTER = 47.5
const TICK_INNER = 44.5

/**
 * Rounded to three decimals, and that is not cosmetic.
 *
 * `Math.sin` and `Math.cos` are not required to be correctly rounded, so Node
 * and the browser's V8 disagree in the last bit or two — the server rendered
 * `x2="11.461869531592484"` where the client computed `...491`, and Vue
 * reported a hydration attribute mismatch on every tick that lands on an
 * irrational coordinate. Fixing the precision makes the two agree exactly.
 * Three decimals is ~0.003px at the size this renders.
 */
const round = (value: number) => Number(value.toFixed(3))

/** Degrees to radians, clockwise from twelve o'clock. */
const radians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * Twelve ticks at 30°, generated rather than written out. Index 0 is twelve
 * o'clock and every fourth tick is a cardinal, drawn heavier — those three, at
 * 0°, 120° and 240°, are the ones a phase actually sits beside.
 */
const ticks = Array.from({ length: 12 }, (_, index) => {
  // 150°, 180° and 210° fall where the curl replaces the ring.
  if (index >= 5 && index <= 7) return null

  const angle = radians(index * 30)
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)

  return {
    x1: round(50 + TICK_OUTER * sin),
    y1: round(50 - TICK_OUTER * cos),
    x2: round(50 + TICK_INNER * sin),
    y2: round(50 - TICK_INNER * cos),
    cardinal: index % 4 === 0
  }
}).filter(tick => tick !== null)

/**
 * The two arrows, one on the middle of each upper arc and just outside the ring.
 *
 * Each points along the direction of travel where it sits, which is what tells
 * a reader the loop runs clockwise — the dot alone only says so while it
 * happens to be passing. The angles are the phases offset by half a turn of the
 * third (60°, 180°, 300°), so an arrow never lands on a cardinal tick, and they
 * ride at radius 50 against the ring's 46, clearing it by four units.
 *
 * The icon cannot be derived: the tangent at each of these is 150°, 270° and
 * 30°, and Lucide's arrows come in 45° steps. Each is the nearest glyph, chosen
 * to stay symmetric about the vertical rather than to round independently.
 * The arc between Implement and Verify gets no glyph; the curl drawn there
 * is its arrow.
 *
 * Rounded through the same `round` as the ticks, and for the same reason —
 * these land in a `style` attribute, which SSR compares character by character.
 */
const ARROW_RADIUS = 50

const ARROWS = [
  { icon: 'i-lucide-arrow-down-right', angle: 60 },
  { icon: 'i-lucide-arrow-up-right', angle: 300 }
].map(({ icon, angle }) => ({
  icon,
  left: `${round(50 + ARROW_RADIUS * Math.sin(radians(angle)))}%`,
  top: `${round(50 - ARROW_RADIUS * Math.cos(radians(angle)))}%`
}))

/**
 * Implement and Verify alternate on every phase, and that is the loop's claim,
 * so the ring itself says it: between the two it curls back once before it
 * goes on, and the dot rides the curl. A glyph in the arrows' slot read as a
 * third, smaller arrow, and two arcs beside the ring read as a second figure
 * (itai-gendler/pdd-kit#91); a ring that loops back on itself needs no legend.
 *
 * The ring stops at `CURL_FROM` and resumes at `CURL_TO`, so the curl replaces
 * that stretch rather than being drawn over it. The curl's control points are
 * in ring units — multiples of `RADIUS` from the centre, y down — so it scales
 * with the ring, and it is the same curve the PDD README diagram draws.
 */
const CURL_FROM = 148
const CURL_TO = 212
const CURL: Array<[number, number]> = [
  [0.325, 0.9625], [0.2, 1.0125], [0.075, 1.0125],
  [-0.2, 1.0125], [-0.25, 0.625], [0, 0.625],
  [0.25, 0.625], [0.2, 1.0125], [-0.075, 1.0125],
  [-0.2, 1.0125], [-0.325, 0.9625]
]

const pointAt = (degrees: number) => ({
  x: round(50 + RADIUS * Math.sin(radians(degrees))),
  y: round(50 - RADIUS * Math.cos(radians(degrees)))
})

const curlStart = pointAt(CURL_FROM)
const curlEnd = pointAt(CURL_TO)
const top = pointAt(0)
const unit = ([x, y]: [number, number]) => `${round(50 + x * RADIUS)} ${round(50 + y * RADIUS)}`

/** Three cubic segments through the loop, the last ending where the ring resumes. */
const curlCurves = [0, 3, 6, 9].map((index) => {
  const [a, b, c] = [CURL[index]!, CURL[index + 1], CURL[index + 2]]
  return c
    ? `C ${unit(a)}, ${unit(b!)}, ${unit(c)}`
    : `C ${unit(a)}, ${unit(b!)}, ${curlEnd.x} ${curlEnd.y}`
}).join(' ')

/** The long way round, Verify back up past Ideate and down to Implement. */
const ring = `M ${curlEnd.x} ${curlEnd.y} A ${RADIUS} ${RADIUS} 0 1 1 ${curlStart.x} ${curlStart.y}`
const curl = `M ${curlStart.x} ${curlStart.y} ${curlCurves}`
/** Where the curl rejoins the ring, pointing the way the dot leaves it. */
const curlHead = `translate(${curlEnd.x} ${curlEnd.y}) rotate(${CURL_TO})`

/**
 * The path the dot rides: twelve o'clock round to the curl, through it, and
 * back up to twelve. It starts at the top so the reduced-motion dot, parked at
 * `offset-distance: 0%`, rests on Ideate. Handed to CSS as a custom property
 * rather than set inline on the dot, which keeps `offset-path` declared beside
 * the animation that drives it.
 */
const orbit = `path('M ${top.x} ${top.y} A ${RADIUS} ${RADIUS} 0 0 1 ${curlStart.x} ${curlStart.y} ${curlCurves} A ${RADIUS} ${RADIUS} 0 0 1 ${top.x} ${top.y}')`

/**
 * Outside the ring, where the desktop figure puts them — but not all at one
 * radius, because a name is a box and a box does not clear a circle evenly.
 *
 * On the vertical axis the nearest part of the label to the ring is its own
 * edge, straight below it, so the gap is simply `R − 46` less half its height.
 * Off the axis the box grows *toward* the circle: at 120° its centre is only
 * `0.866·R` from the vertical while the ring at that height is already
 * `√(46² − (0.5·R)²)` out, and it is an inside corner that arrives first.
 *
 * One radius therefore cannot serve both. At a flat 62 the two lower names were
 * correct and Ideate hung 23px off the ring — floating between the figure and
 * the paragraph above it, belonging to neither, and eating the space over it
 * with its own overhang. At a flat 54 Ideate was right and the lower-right
 * name opened on the ring stroke across a cardinal tick.
 *
 * So the radius is interpolated by `|sin|`: axial where the label sits over or
 * under the circle, lateral where it sits beside it. Interpolating rather than
 * branching on the angle also means a fourth phase landing at 90° gets the
 * right radius without a new case.
 *
 * **The lateral names also lean toward six o'clock.** On the 120° ray itself a
 * name as long as `Implement` cannot both clear the ring and stay inside a
 * 320px panel: its inner corner meets the tick, or its outer edge leaves the
 * panel. A few degrees lower, the ring has already started to curve away under
 * it, so the same name clears the stroke with room to spare and still reads as
 * the label for the tick just above it. The lean scales with `sin`, so Ideate
 * at twelve o'clock does not move.
 *
 * **This deliberately overflows the wheel's own box**, which is exactly
 * `--loop-circle`, so everything past radius 50 hangs outside it. `LoopPanel`
 * sizes the circle from that rather than the other way round; the vertical
 * overhang is paid for with margin there.
 *
 * None of this is trusted as arithmetic: `landing.mobile.spec.ts` measures the
 * section for horizontal overflow at 320px in this exact treatment.
 */
const PHASE_RADIUS_AXIAL = 54
const PHASE_RADIUS_LATERAL = 68
const PHASE_LEAN = 6

const phaseMarks = computed(() => phases.map((name, index) => {
  const degrees = (index * 360) / phases.length
  const sin = Math.sin(radians(degrees))
  const radius = PHASE_RADIUS_AXIAL
    + (PHASE_RADIUS_LATERAL - PHASE_RADIUS_AXIAL) * Math.abs(sin)
  const angle = radians(degrees + PHASE_LEAN * sin)

  return {
    name,
    left: `${round(50 + radius * Math.sin(angle))}%`,
    top: `${round(50 - radius * Math.cos(angle))}%`
  }
}))
</script>

<template>
  <div class="loop-wheel" :style="{ '--loop-orbit': orbit }" aria-hidden="true">
    <svg class="loop-wheel-art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <path class="loop-wheel-ring" :d="ring" />
      <path class="loop-wheel-curl" :d="curl" />
      <path class="loop-wheel-curl" d="M -1.6 -1.6 L 0.4 0 L -1.6 1.6" :transform="curlHead" />
      <line
        v-for="(tick, index) in ticks"
        :key="index"
        class="loop-wheel-tick"
        :class="{ 'loop-wheel-tick--cardinal': tick.cardinal }"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
      />
    </svg>

    <!-- The dot gets its own overlaid canvas. `offset-path` resolves against the
      element's own coordinate system and positions it outright, which is why
      the circle is at the origin rather than at the centre of the ring — and
      why keeping it out of the graphic above lets that stay wholly static. -->
    <svg class="loop-wheel-orbit" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <circle
        class="loop-wheel-dot"
        cx="0"
        cy="0"
        r="2.2"
      />
    </svg>

    <span
      v-for="arrow in ARROWS"
      :key="arrow.icon"
      class="loop-wheel-arrow"
      :style="{ top: arrow.top, left: arrow.left }"
    >
      <UIcon :name="arrow.icon" class="size-3.5" />
    </span>

    <span
      v-for="phase in phaseMarks"
      :key="phase.name"
      class="loop-wheel-phase"
      :style="{ top: phase.top, left: phase.left }"
    >{{ phase.name }}</span>

    <div class="loop-wheel-center">
      <span class="loop-wheel-center-label">{{ label }}</span>
      <span class="loop-wheel-center-mark">{{ mark }}</span>
    </div>
  </div>
</template>

<style scoped>
/*
  The reference draws a gold ring against cool patina ticks. This palette has no
  cool step and should not grow one for a decoration, so the second tone is
  umber — the warm neutral that already sits under brass everywhere else. The
  two-tone treatment survives; the hue does not.
*/
.loop-wheel {
  --loop-line: var(--color-brass-600);
  --loop-tick: var(--color-umber-400);
  --loop-dot: var(--color-brass-500);

  position: relative;
  aspect-ratio: 1;
  width: 100%;
}

/* Brass at 600 disappears into a near-black ground, so the ramp comes up as the
  page goes down. */
.dark .loop-wheel {
  --loop-line: var(--color-brass-400);
  --loop-tick: var(--color-umber-500);
  --loop-dot: var(--color-brass-300);
}

.loop-wheel-art,
.loop-wheel-orbit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* The dot's stroke box sits outside the viewBox at the top of the orbit. */
  overflow: visible;
}

.loop-wheel-art {
  z-index: 2;
}

.loop-wheel-orbit {
  z-index: 3;
  pointer-events: none;
}

/* Hairlines: at the size this renders, 0.4 viewBox units is close to one device
  pixel. The ring is a guide for the dot, not a border. */
.loop-wheel-ring {
  fill: none;
  stroke: var(--loop-line);
  stroke-width: 0.4px;
  opacity: 0.65;
}

.loop-wheel-tick {
  stroke: var(--loop-tick);
  stroke-width: 0.6px;
  opacity: 0.55;
}

/* The curl is the figure's one heavy line: the claim it draws is the loop's,
  so it outweighs the hairline ring it interrupts. */
.loop-wheel-curl {
  fill: none;
  stroke: var(--loop-line);
  stroke-width: 1px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.loop-wheel-tick--cardinal {
  stroke: var(--loop-line);
  stroke-width: 1px;
  opacity: 1;
}

/*
  The entire animation.

  `offset-path` is applied unconditionally and only the `animation` is withheld
  under reduced motion, which parks the dot at `offset-distance: 0%` — twelve
  o'clock, where Ideate sits and the loop starts. Declaring the path inside the
  query instead, as the reference does, leaves the dot at its own origin and
  strands it in the corner of the box.

  22 seconds because it has to read as ambient. Anything near a spinner's speed
  pulls the eye off the three phases the section is actually about.
*/
.loop-wheel-dot {
  fill: var(--loop-dot);
  offset-path: var(--loop-orbit);
}

@media (prefers-reduced-motion: no-preference) {
  .loop-wheel-dot {
    animation: loop-wheel-orbit 22s linear infinite;
  }
}

@keyframes loop-wheel-orbit {
  from {
    offset-distance: 0%;
  }

  to {
    offset-distance: 100%;
  }
}

/* Behind the ring, matching the reference: the disc is a ground for the glyph,
  not a mask cut through the circle. */
.loop-wheel-arrow {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  /* Nuxt UI icons paint themselves with `currentColor` through a mask, so the
    ground has to be a wrapper — a background on the icon would erase it. */
  background: var(--ui-bg);
  color: var(--loop-dot);
}

/*
  Off unless the arrangement using this wheel turns them on, which today is the
  phone and nothing else. Declared off here rather than switched on here because
  this component cannot see how wide its host is drawing it — `LoopPanel` owns
  that, and a default of `block` would put a second copy of all three names
  inside the desktop figure the moment anyone passed the prop.

  **The same treatment the phase headings get, at the size the dial can hold.**
  These were mono uppercase first, on the argument that the centre plate and the
  tick marks are already engraved that way and a third voice would compete with
  the real headings below. That was the wrong reading of the figure: these name
  the same three things the `h3`s name, a reader meets both within one screen,
  and setting them in a different face made them look like a different kind of
  object rather than a quieter copy of the same one. So they inherit the sans,
  take `font-semibold` and the headings' tight tracking, and keep the sentence
  case the content is authored in — `text-xl` scaled down to what fits beside a
  158px circle with a name as long as `Implement` on one side of it.

  The centre plate stays mono, and now genuinely reads as the thing it is: a
  maker's mark stamped on the instrument, not a station on it.
*/
.loop-wheel-phase {
  display: none;
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%);
  color: var(--ui-text-highlighted);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
  /* One word each, and a name that wrapped inside a circle would read as two
    stations. `homeContent.test.ts` holds the phase names to one word. */
  white-space: nowrap;
}

.loop-wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* No gap: the two lines are one label, and their own leading is already
    generous at this size. A row gap on top of it opened them into two. */
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/*
  One face and one size for both lines, so the centre reads as a single signature
  rather than as a caption with a mark under it. That is also what keeps PDD from
  looking like a mark of its own: set identically to the name above it, it is
  plainly the second line of a two-line label. ADR-0002 rules out giving PDD a
  wordmark, and equal weight is the treatment that respects it.

  **Mono, and small.** The brand has three faces and no fourth
  (`docs/brand.md`); of the three, mono is the only
  one not already spoken around this figure — the phase names are the heading
  face and the notes are the body face — so it is what makes the centre read as
  stamped on the instrument rather than as one more heading. Wide tracking and a
  size under the body text are the rest of it: a plate label is small on purpose,
  and at display size this was competing with the three phases for the eye.
*/
.loop-wheel-center-label,
.loop-wheel-center-mark {
  color: var(--ui-text-toned);
  font-family: var(--font-mono);
  font-size: clamp(0.6875rem, 1.1vw, 0.8125rem);
  font-weight: 500;
  letter-spacing: 0.22em;
  line-height: 1.5;
  text-transform: uppercase;
}
</style>

<script lang="ts">
  import intervals from './utils/intervals'
  import { formatTimespan, formatTimeStamp } from './utils/time'
  import * as vec from './utils/vector'
  import type { Vector } from './utils/vector'
  import debounce from 'lodash/debounce'
  import { bezier } from './utils/ease'
  import App from './App.svelte'
  import * as wiki from './utils/wiki'
  import { article } from './stores'
  import Icon from './Icon.svelte'
  import Search from './Search.svelte'
  import { some } from 'lodash'

  const isPhone = window.matchMedia('(hover: none) and (pointer: coarse)')
    .matches

  const levels = intervals(true)

  for (let level of levels) {
    if (level[0].start > levels[0][0].start)
      level.unshift({
        name: '',
        lvl: level[0].lvl,
        color: '#3335',
        start: levels[0][0].start,
        end: level[0].start,
        txColor: '#fff',
      })
  }

  const start = Math.min(...levels[0].map(({ start }) => start))
  const end = Math.max(...levels[0].map(({ end }) => end))
  const firstStart = levels[0][0].start
  const lastEnd = levels[0].slice(-1)[0].end
  let hovered: typeof levels[number][number]

  const buffer = 0.05
  const vb = {
    x: start - (end - start) * buffer,
    y: 0,
    w: (end - start) * (1 + buffer * 2),
    h: (500 / window.innerWidth) * (end - start),
  }

  $: sf = 10 ** Math.floor(Math.log10(vb.w))

  $: scale = (n: number) => n / sf

  const HEIGHT = window.innerHeight

  const layerHeight = 20
  const layerBuffer = 10
  const layersTotalHeigt =
    levels.length * layerHeight + (levels.length - 1) * layerBuffer
  const hovPx = 3
  const tsTop = 30

  let searchQuery: string
  let searchHits: typeof levels[number][number][] = []

  $: {
    if (searchQuery) {
      searchHits = levels
        .flat()
        .filter(({ name }) => name.toLowerCase().includes(searchQuery))

      if (searchHits.length) {
        const min = Math.min(...searchHits.map(({ start }) => start))
        const max = Math.max(...searchHits.map(({ end }) => end))

        goTo({ min, max })
      }
    } else {
      searchHits = []
      updateGap()
      if (typeof searchQuery === 'string')
        goTo({ min: firstStart, max: lastEnd })
    }
  }

  const gaps = Array(levels.length - 1).fill(0)
  const gapSize = window.innerHeight / (levels.length + 3)
  const gapBounds: [number, number][] = Array(gaps.length).fill([0, 0])
  for (let i = 0; i < gapBounds.length; i++)
    gapBounds[i] = [
      Math.max(
        ...levels[i].map(({ name, start, end }) =>
          name ? Math.abs(end - start) : 0
        )
      ),
      i === 0 ? 4500 : gapBounds[i - 1][0],
    ]

  let pinching = false
  let pinchStart: [Vector, Vector]
  let lastPinch: [Vector, Vector]

  function scroll(e: WheelEvent) {
    e.preventDefault()
    let { wheelDeltaX, wheelDeltaY } = e as any
    if (!wheelDeltaY && !wheelDeltaX) {
      wheelDeltaX = -e.deltaX
      wheelDeltaY = -e.deltaY
    }
    if (e.shiftKey) [wheelDeltaY, wheelDeltaX] = [wheelDeltaX, wheelDeltaY]
    wheelDeltaX *= -1
    if (e.ctrlKey) {
      e.preventDefault()
      wheelDeltaY *= 5
    }
    if (Math.abs(wheelDeltaY) > Math.abs(wheelDeltaX))
      zoom(wheelDeltaY / 2000, e.screenX / window.innerWidth)
    else pan(wheelDeltaX / 2000)

    boundCheck()
  }

  function zoom(scaleBy: number, center = 0.5) {
    const span = vb.w / (1 + buffer * 2)
    if (span - span * scaleBy > end - start) {
      scaleBy = 1 - (end - start) / span
    } else if (
      span * (1 - scaleBy) <
      Math.log(Math.abs(vb.x + vb.w - 1.0001)) / 4
    )
      scaleBy = 1 - Math.log(Math.abs(vb.x + vb.w - 1.0001)) / 4 / span
    vb.x += span * (scaleBy * center)
    vb.w -= span * scaleBy
    updateGap()
  }

  function pan(dx: number) {
    vb.x += vb.w * dx
    const span = vb.w / (1 + buffer * 2)
    if (span < Math.log(Math.abs(vb.x + vb.w - 1.0001)) / 4)
      vb.w -= span * (1 - Math.log(Math.abs(vb.x + vb.w - 1.0001)) / 4 / span)
  }

  function updateGap() {
    const span = vb.w / (1 + buffer * 2)
    for (let i = 0; i < gapBounds.length; i++) {
      if (isPhone) gaps[i] = span < gapBounds[i][0] ? gapSize : 0
      else {
        gaps[i] =
          (searchHits.length &&
          levels[i + 1].filter((span) => searchHits.includes(span)).length <
            Math.min(4, levels[i + 1].length / 4)
            ? 1
            : bezier(
                Math.min(
                  1,
                  Math.max(
                    0,
                    1 -
                      (span - gapBounds[i][0]) /
                        (gapBounds[i][1] - gapBounds[i][0])
                  )
                )
              )) * gapSize
      }
    }
  }

  function boundCheck() {
    const curBuff = buffer * (vb.w / ((end - start) * (1 + 2 * buffer)))
    if (vb.x < start - (end - start) * curBuff)
      vb.x = start - (end - start) * curBuff
    else if (vb.x + vb.w > start + (end - start) * (1 + curBuff))
      vb.x = start + (end - start) * (1 + curBuff) - vb.w
  }

  function touchStart({ touches }: TouchEvent) {
    if (touches.length !== 2) {
      pinching = false
      return
    }
    pinching = true
    pinchStart = Array.from(touches).map(({ screenX, screenY }) => [
      screenX,
      screenY,
    ]) as typeof pinchStart
  }

  function touchEnd() {
    pinching = false
  }

  const pinch = debounce(
    () => {
      if (!lastPinch) return

      const start = vec.minus(pinchStart[1], pinchStart[0])
      const last = vec.minus(lastPinch[1], lastPinch[0])

      const dist = vec.mag(last) - vec.mag(start)

      const left = pinchStart[0][0] < pinchStart[1][0] ? 0 : 1
      const xDiff = lastPinch.map((v, i) => Math.abs(v[0] - pinchStart[i][0]))

      let center = 0.5

      if (xDiff[0] + xDiff[1])
        center =
          (pinchStart[left][0] +
            (pinchStart[Number(!left)][0] - pinchStart[left][0]) / 2) /
            window.innerWidth +
          (xDiff[left] / (xDiff[0] + xDiff[1])) *
            ((lastPinch[0][0] -
              pinchStart[0][0] +
              (lastPinch[1][0] - pinchStart[1][0])) /
              window.innerWidth)

      zoom(dist / 500, center)
      boundCheck()

      pinchStart = lastPinch
      lastPinch = undefined
    },
    1000 / 30,
    { leading: true, trailing: true }
  )

  function touchMove(e: TouchEvent) {
    if (e.touches.length !== 2) return void (pinching = false)
    e.preventDefault()
    if (!pinching) return touchStart(e)
    lastPinch = Array.from(e.touches).map(({ screenX, screenY }) => [
      screenX,
      screenY,
    ]) as typeof lastPinch
    pinch()
  }

  let stId: number
  async function goTo({
    target,
    min,
    max,
  }: {
    target?: typeof levels[number][number]
    min?: number
    max?: number
  }) {
    const startW = vb.w
    const targetW =
      (target ? target.end - target.start : max - min) * (1 + 2 * buffer)
    const startX = vb.x
    const targetX = target
      ? target.start - (target.end - target.start) * buffer
      : min - (max - min) * buffer
    const dur = 500
    const start = performance.now()

    const step = () => {
      const prog = (performance.now() - start) / dur
      if (prog >= 1) {
        vb.w = targetW
        vb.x = targetX
        updateGap()
        return
      }
      const eased = bezier(prog)
      vb.w = startW + eased * (targetW - startW)
      vb.x = startX + eased * (targetX - startX)
      updateGap()
      stId = requestAnimationFrame(step)
    }
    cancelAnimationFrame(stId)
    stId = requestAnimationFrame(step)
  }

  async function onClick(span: typeof levels[number][number]) {
    goTo({ target: span })
  }

  function loadArticle(span: typeof levels[number][number]) {
    wiki.fetchArticle(span.name).then(() => article.set(span.name))
  }

  let pointerDown = false
  function onPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).tagName?.toLowerCase() !== 'svg') return
    pointerDown = true
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointerDown) return
    pan(-e.movementX / window.innerWidth)
    boundCheck()
  }

  $: xPx = (1 / window.innerWidth) * scale(vb.w)
  $: minX = vb.x - vb.w / 2

  $: span = vb.w * 1e6
  $: step = 1 * 10 ** (Math.log10(span) | 0)
  $: while (((span / step) | 0) < 4) step /= 2
  $: steps = Array(Math.ceil(span / step) + 1)
    .fill(0)
    .map((_, i) =>
      Math.max((Math.floor((vb.x * 1e6) / step) + i) * step, firstStart * 1e6)
    )
  $: if (steps[1] - steps[0] < step / 2) steps = [steps[0], ...steps.slice(2)]
</script>

<style>
  .wrap {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .timeline {
    width: 100%;
    height: 100%;
    --off-x: 0px;
    --scale-x: 1;
  }

  .line {
    transform-origin: center;
    transform-origin: 50% 50%;
    transform-box: fill-box;
    transition: opacity 15s ease;
  }

  @media (hover: hover), (pointer: fine) {
    .line {
      transition: transform 0.1s ease-out, opacity 0.1s ease;
      transform: translateX(var(--off-x)) scaleX(var(--scale-x));
    }

    .line[data-id]:hover {
      transform: translateX(var(--off-x)) scaleX(var(--scale-x)) scaleY(1.2);
      cursor: pointer;
    }
  }

  .timespan {
    color: #fff8;
    position: absolute;
    left: 50vw;
    bottom: 1rem;
    font-size: 1rem;
    text-align: center;
    transform-style: preserve-3d;
    transform: translateX(-50%);
    background-color: #111;
    padding: 0 1rem;
    box-sizing: border-box;
    font-size: 0.9rem;
    user-select: none;
  }

  .timespan::before,
  .timespan::after {
    content: '';
    position: absolute;
    left: 50%;
    width: calc(100vw - var(--buff-left) - var(--buff-right));
    transform: translateX(calc((100vw - var(--buff-left) * 2) / -2))
      translateZ(-1px);
  }

  .timespan::before {
    background-color: #fff5;
    top: 50%;
    height: 1px;
  }

  .timespan::after {
    height: 100%;
    border-left: 1px solid #fff5;
    border-right: 1px solid #fff5;
    margin-left: -1px;
  }

  .label-container {
    display: block;
    position: fixed;
    height: 2rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
    transform: translateY(-100%);
    content-visibility: auto;
    margin-right: -1.5rem;
    padding-right: 1.5rem;
    user-select: none;
  }

  .label {
    color: #fff;
    font-size: 12px;
    transition: opacity 0.2s ease;
    position: sticky;
    left: 10px;
    right: 10px;
    max-width: 100%;
    display: flex;
    align-items: center;
    --overflow: hidden;
  }

  .label > :global(span) {
    overflow-x: var(--overflow);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .label > :global(svg) {
    height: 1rem;
    margin-left: 0.5rem;
    margin-right: -1.5rem;
    opacity: 0;
    transition: 0.1s ease opacity;
  }

  .label-container:hover :global(svg) {
    opacity: 1;
  }

  .timestamps {
    transition: opacity 0.2s ease-out;
  }

  .timestamp {
    font-size: 100px;
    text-anchor: middle;
    transform-box: fill-box;
    transform-origin: center 79%;
    transition: opacity 0.5s ease;
    text-rendering: geometricPrecision;
    user-select: none;
    fill: #fff8;
  }

  .ts-mark {
    fill: #fff8;
  }

  .search {
    position: fixed;
    top: 5vw;
    right: 5vw;
  }
</style>

<div
  class="wrap"
  style={`--buff-left: ${vb.x >= firstStart ? 0 : ((firstStart - vb.x) / vb.w) * window.innerWidth}px; --buff-right: ${lastEnd - vb.x >= vb.w ? 0 : ((vb.w - (lastEnd - vb.x)) / vb.w) * window.innerWidth}px; --zoom: ${(lastEnd - firstStart) / vb.w}; --left: ${((vb.x - firstStart) / -(lastEnd - firstStart)) * 100}%`}
  on:wheel={scroll}
  on:touchstart={touchStart}
  on:touchmove={touchMove}
  on:touchend={touchEnd}
  on:mousemove={(e) => {
    const id = e.target.dataset.id
    if (!id) {
      hovered = undefined
      return
    }
    const [lvl, name] = id.split('-')
    hovered = levels[parseInt(lvl) - 1].find((v) => v.name === name)
  }}
  on:pointerdown={onPointerDown}
  on:pointerup={() => {
    pointerDown = false
  }}
  on:pointerleave={() => {
    pointerDown = false
  }}
  on:pointermove={onPointerMove}>
  <div class="search">
    <Search
      bind:input={searchQuery}
      results={searchHits}
      onSelect={(target) => goTo({ target })} />
  </div>
  <svg
    class="timeline"
    viewBox={`${scale(vb.x)} 0 ${scale(vb.w)} ${HEIGHT}`}
    preserveAspectRatio="none"
    stroke-width={(0.5 / window.innerWidth) * scale(vb.w)}>
    <g class="timestamps" style={`opacity: ${vb.w > 4e3 ? 0 : 1}`}>
      {#each steps as step}
        <text
          class="timestamp"
          x={scale(step / 1e6)}
          y={tsTop}
          transform={`scale(${scale(vb.w) / window.innerWidth / (HEIGHT / window.innerHeight) / 10} 0.1)`}>
          {formatTimeStamp(step)}
        </text>
        <polygon
          class="ts-mark"
          points={`${scale(step / 1e6) - 4 * xPx} ${tsTop + 7} ${scale(step / 1e6) + 4 * xPx} ${tsTop + 7} ${scale(step / 1e6)} ${tsTop + 14}`} />
      {/each}
    </g>
    {#each levels as level}
      {#each level as span}
        {#if span.end > vb.x && span.start < vb.x + vb.w}
          <rect
            class="line"
            data-id={span.name ? `${span.lvl}-${span.name}` : undefined}
            x={scale(Math.max(span.start, minX))}
            y={HEIGHT / 2 - layersTotalHeigt / 2 + (span.lvl - 1) * (layerHeight + layerBuffer) + gaps.reduce((a, c, i) => a + (c / 2) * (i < span.lvl - 1 ? 1 : -1), 0)}
            width={scale(span.end - Math.max(span.start, minX))}
            height={layerHeight}
            fill={span.color}
            on:click={span.name ? () => onClick(span) : undefined}
            style={`
              opacity: ${!searchQuery || searchHits.includes(span) ? 1 : 0.2};
              ${!(hovered && (span.start < hovered.start || span.end > hovered.end)) ? '' : span.start >= hovered.end || span.end <= hovered.start ? `--off-x: ${hovPx * xPx * (span.end <= hovered.start ? -1 : 1)}px` : [`--scale-x: ${((span.start < hovered.start && span.end > hovered.end ? 2 * hovPx : hovPx) * xPx + scale(span.end - span.start)) / scale(span.end - span.start)}`, ...(span.start < hovered.start && span.end > hovered.end ? [] : [`--off-x: ${(span.start >= hovered.start ? hovPx / 2 : -hovPx / 2) * xPx}px`])].join('; ')}
            `} />
        {/if}
      {/each}
    {/each}
  </svg>
  {#each levels as level}
    {#if level[0].lvl === 1 || gaps[level[0].lvl - 2] > 0}
      {#each level as span}
        <div
          class="label-container"
          style={`
            top: ${HEIGHT / 2 - layersTotalHeigt / 2 + (level[0].lvl - 1) * (layerHeight + layerBuffer) + gaps.reduce((a, c, i) => a + (c / 2) * (i < level[0].lvl - 1 ? 1 : -1), 0)}px;
            left: ${((span.start - vb.x) / vb.w) * 100}%;
            width: ${((span.end - span.start) / vb.w) * 100}%;
            `}>
          <div
            class="label"
            color={span.txColor}
            style={`color: ${span.txColor}; ${searchHits.length ? (searchHits.includes(span) ? 'opacity: 1; --overflow: visible;' : 'opacity: 0;') : `opacity: ${(level[0].lvl === 1 && vb.w < 5060) || span === hovered || gaps[span.lvl - 2] >= (span !== hovered ? gapSize * 0.75 : layerBuffer * 1.6) ? 1 : 0}`}`}>
            <span>{span.name}</span>
            <Icon icon="info" color="#fffc" onClick={() => loadArticle(span)} />
          </div>
        </div>
      {/each}
    {/if}
  {/each}
  <span class="timespan">
    {formatTimespan((Math.min(vb.x + vb.w, lastEnd) - Math.max(vb.x, firstStart)) * 1e6)}
    years
  </span>
</div>

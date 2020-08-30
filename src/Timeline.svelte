<script lang="ts">
  import data from '../data/intervals.json'
  import { blendHexColorString as blend } from './utils/color'
  import { formatTimespan } from './utils/time'

  let byLvl = {}
  for (let interval of data) {
    if (!(interval.lvl in byLvl)) byLvl[interval.lvl] = []
    byLvl[interval.lvl].push({
      ...interval,
      start: -interval.start,
      end: -interval.end,
      txColor: blend(interval.color + '55', '#ffffff'),
    })
  }

  const levels: (typeof data[number] & {
    txColor: string
  })[][] = Object.entries(byLvl)
    .sort(([k1], [k2]) => parseInt(k1) - parseInt(k2))
    .map(([, v]) => v) as any

  const start = Math.min(...levels[0].map(({ start }) => start))
  const end = Math.max(...levels[0].map(({ end }) => end))
  const firstStart = levels[0][0].start
  const lastEnd = levels[0].slice(-1)[0].end

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

  const gaps = Array(levels.length - 1).fill(0)
  const gapSize = 25
  const gapBounds: [number, number][] = Array(gaps.length)
    .fill([0, 0])
    .map((_, i, arr) => [
      Math.max(...levels[i].map(({ start, end }) => Math.abs(end - start))),
      arr[i - 1] || 4500,
    ])
  for (let i = 0; i < gapBounds.length; i++)
    gapBounds[i] = [
      Math.max(...levels[i].map(({ start, end }) => Math.abs(end - start))),
      i === 0 ? 4500 : gapBounds[i - 1][0],
    ]

  function scroll(e: MouseWheelEvent) {
    let { deltaX, deltaY } = e
    if (e.ctrlKey) {
      e.preventDefault()
      deltaY *= 5
    }
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      let scaleBy = -deltaY / 1000
      const span = vb.w / (1 + buffer * 2)
      if (span - span * scaleBy > end - start)
        scaleBy = 1 - (end - start) / span

      vb.x += span * (scaleBy * (e.screenX / window.innerWidth))
      vb.w -= span * scaleBy
      for (let i = 0; i < gapBounds.length; i++)
        gaps[i] = Math.max(
          0,
          Math.min(
            1,
            1 -
              (span + span * scaleBy - gapBounds[i][0]) /
                (gapBounds[i][1] - gapBounds[i][0])
          ) * gapSize
        )
    } else {
      vb.x += vb.w * (deltaX / 1000)
    }

    const curBuff = buffer * (vb.w / ((end - start) * (1 + 2 * buffer)))
    if (vb.x < start - (end - start) * curBuff)
      vb.x = start - (end - start) * curBuff
    else if (vb.x + vb.w > start + (end - start) * (1 + curBuff))
      vb.x = start + (end - start) * (1 + curBuff) - vb.w
  }
</script>

<style>
  .timeline {
    width: 100%;
    height: 100%;
  }

  .line {
    transform-origin: center;
    transition: transform 0.1s ease-out;
    opacity: 0.9;
    transform-origin: 50% 50%;
    transform-box: fill-box;
  }

  .line:hover {
    transform: scaleY(1.2);
  }

  text {
    font-size: 12px;
    text-anchor: middle;
    transform-box: fill-box;
    transform-origin: center;
  }

  .timespan {
    --buff-left: 0px;
    --buff-right: 0px;

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
</style>

<svg
  class="timeline"
  viewBox={`${scale(vb.x)} 0 ${scale(vb.w)} ${HEIGHT}`}
  preserveAspectRatio="none"
  stroke-width={(0.5 / window.innerWidth) * scale(vb.w)}
  on:mousewheel={scroll}>
  {#each levels as level}
    {#each level as span}
      {#if span.end > vb.x && span.start < vb.x + vb.w}
        {#if span.lvl === 1 || gaps[span.lvl - 2] === gapSize}
          <text
            x={scale(span.start) + scale(span.end - span.start) / 2}
            y={HEIGHT / 2 - layersTotalHeigt / 2 + (span.lvl - 1) * (layerHeight + layerBuffer) - layerBuffer + gaps.reduce((a, c, i) => a + (c / 2) * (i < span.lvl - 1 ? 1 : -1), 0)}
            fill={span.txColor}
            transform={`scale(${scale(vb.w) / window.innerWidth / (HEIGHT / window.innerHeight)} 1)`}>
            {span.name}
          </text>
        {/if}
        <rect
          class="line"
          x={scale(span.start)}
          y={HEIGHT / 2 - layersTotalHeigt / 2 + (span.lvl - 1) * (layerHeight + layerBuffer) + gaps.reduce((a, c, i) => a + (c / 2) * (i < span.lvl - 1 ? 1 : -1), 0)}
          width={scale(span.end - span.start)}
          height={layerHeight}
          fill={span.color} />
      {/if}
    {/each}
  {/each}
</svg>
<span
  class="timespan"
  style={`--buff-left: ${vb.x >= firstStart ? 0 : ((firstStart - vb.x) / vb.w) * window.innerWidth}px; --buff-right: ${lastEnd - vb.x >= vb.w ? 0 : ((vb.w - (lastEnd - vb.x)) / vb.w) * window.innerWidth}px;`}>
  {formatTimespan((Math.min(vb.x + vb.w, lastEnd) - Math.max(vb.x, firstStart)) * 1e6)}
  years
</span>

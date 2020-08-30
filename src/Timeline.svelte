<script lang="ts">
  import data from '../data/intervals.json'
  import { blendHexColorString as blend } from './utils/color'

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

  const buffer = 0.05
  const vb = {
    x: start - (end - start) * buffer,
    y: 0,
    w: (end - start) * (1 + buffer * 2),
    h: (500 / window.innerWidth) * (end - start),
  }

  $: scale = (n: number): number => {
    const f = Math.ceil(vb.w / 1000)
    return n / f
  }

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
    if (e.ctrlKey) e.preventDefault()
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      let scaleBy = -e.deltaY / 1000
      const span = vb.w / (1 + buffer * 2)
      if (span - span * scaleBy > end - start)
        scaleBy = 1 - (end - start) / span
      vb.x += span * (scaleBy / 2)
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
      vb.x += vb.w * (e.deltaX / 1000)
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
</style>

<svg
  class="timeline"
  viewBox={`${scale(vb.x)} 0 ${scale(vb.w)} ${HEIGHT}`}
  preserveAspectRatio="none"
  stroke-width={(0.5 / window.innerWidth) * scale(vb.w)}
  on:mousewheel={scroll}>
  {#each levels as level}
    {#each level as span}
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
    {/each}
  {/each}
</svg>

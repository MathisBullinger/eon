<script lang="ts">
  import data from '../data/intervals.json'

  let byLvl = {}
  for (let interval of data) {
    if (!(interval.lvl in byLvl)) byLvl[interval.lvl] = []
    byLvl[interval.lvl].push({
      ...interval,
      start: -interval.start,
      end: -interval.end,
    })
  }

  const levels: typeof data[] = Object.entries(byLvl)
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

  function scroll(e: MouseWheelEvent) {
    if (e.ctrlKey) e.preventDefault()
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const scaleBy = -e.deltaY / 1000
      const span = vb.w / (1 + buffer * 2)
      vb.x += span * (scaleBy / 2)
      vb.w -= span * scaleBy
    } else {
      vb.x += vb.w * (e.deltaX / 1000)
    }
  }
</script>

<style>
  .timeline {
    width: 100%;
    height: 100%;
  }

  .line {
    transform-origin: center 5px;
    transition: transform 0.1s ease-out;
    opacity: 0.9;
    transform-origin: 50% 50%;
    transform-box: fill-box;
  }

  .line:hover {
    transform: scaleY(1.2);
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
      <rect
        class="line"
        x={scale(span.start)}
        y={HEIGHT / 2 - layersTotalHeigt / 2 + (span.lvl - 1) * (layerHeight + layerBuffer)}
        width={scale(span.end - span.start)}
        height={layerHeight}
        fill={span.color} />
    {/each}
  {/each}
</svg>

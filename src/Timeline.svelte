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
    transition: transform 0.15s ease;
  }
</style>

<svg
  class="timeline"
  viewBox={`${scale(vb.x)} 0 ${scale(vb.w)} ${HEIGHT}`}
  preserveAspectRatio="none"
  on:mousewheel={scroll}>
  {#each levels as level}
    {#each level as span}
      <rect
        class="line"
        x={scale(span.start)}
        y={span.lvl * 20 + 10}
        width={scale(span.end - span.start)}
        height={10}
        fill={span.color} />
    {/each}
  {/each}
</svg>

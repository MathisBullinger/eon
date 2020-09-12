<script lang="ts">
  import intervals from './utils/intervals'

  const levels = intervals().map((lvl) => lvl.filter(({ name }) => name))

  let min = levels[0][0].start
  let max = levels[0].slice(-1)[0].end
  const span = max - min
  min -= span * 0.01
  max += span * 0.01

  const pos = (r: number, v: number) => [
    50 + Math.sin(((v - min) / (max - min)) * 2 * -Math.PI) * r,
    50 + Math.cos(((v - min) / (max - min)) * 2 * -Math.PI) * r,
  ]

  const lastToFirstRatio = 4

  const _relativeSpace = Array(levels.length)
    .fill(1)
    .map((v, i, { length }) => v + (i / (length - 1)) * (lastToFirstRatio - 1))
  const _totalSpace = _relativeSpace.reduce((a, c) => a + c)
  const _spaceDist = _relativeSpace.map((v) => v / _totalSpace)
  const _relPos = _spaceDist.map(
    (v, i, arr) => arr.slice(0, i).reduce((a, c) => a + c, 0) + v / 2
  )

  const radius = (lvl: number) => 5 + _relPos[lvl] * 45

  const segment = (lvl: number, start: number, end: number) => {
    const r = radius(lvl)
    const [x1, y1] = pos(r, start - span * 0.001)
    const [x2, y2] = pos(r, end + span * 0.001)

    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
</script>

<style>
  svg {
    position: absolute;
    --size: 95vmin;

    width: var(--size);
    height: var(--size);
    left: calc((100vw - var(--size)) / 2);
    top: calc((100vh - var(--size)) / 2);
  }

  path {
    fill: none;
  }
</style>

<svg width={100} height={100} viewBox="0 0 100 100">
  {#each levels as level}
    {#each level as interval}
      <path
        d={segment(levels.indexOf(level), interval.start, interval.end)}
        stroke={interval.color}
        stroke-width={_spaceDist[levels.indexOf(level)] * 45 - 1} />
    {/each}
  {/each}
</svg>

<script lang="ts">
  import intervals from './utils/intervals'

  const levels = intervals().map((lvl) => lvl.filter(({ name }) => name))

  $: console.log(levels)

  let min = levels[0][0].start
  let max = levels[0].slice(-1)[0].end

  $: scaling = 1

  $: pos = (r: number, v: number) => {
    v = Math.min(1, ((Math.max(v, min) - min) / (max - min)) ** scaling)

    const gap = 0.03

    return [
      50 + Math.sin(v * 2 * -Math.PI * (1 - gap) - (Math.PI * gap) / 2) * r,
      50 + Math.cos(v * 2 * -Math.PI * (1 - gap) - (Math.PI * gap) / 2) * r,
    ]
  }

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

  $: layers = levels.map((level, i) => {
    const r = radius(i)
    return level
      .map(({ start, end, color }) => {
        const offset = 0.0001
        const [x1, y1] = pos(r, start - (max - min) * offset)
        const [x2, y2] = pos(r, end + (max - min) * offset)
        if (Math.abs(x2 - x1) + Math.abs(y2 - y1) < 0.15) return
        return {
          d: `M ${x1} ${y1} A ${r} ${r} 0 ${
            (x2 - x1) * (50 - y1) - (y2 - y1) * (50 - x1) > 0 ? 0 : 1
          } 1 ${x2} ${y2}`,
          color,
          width: _spaceDist[i] * 45 - 1,
        }
      })
      .filter(Boolean)
  })

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

    scaling = Math.max(1, scaling + scaling * (wheelDeltaY / 1000))
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

<svg width={100} height={100} viewBox="0 0 100 100" on:wheel={scroll}>
  {#each layers as layer}
    {#each layer as { d, color, width }}
      <path {d} stroke={color} stroke-width={width} />
    {/each}
  {/each}
</svg>

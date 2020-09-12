<script lang="ts">
  import intervals from './utils/intervals'
  import throttle from 'lodash/throttle'

  const levels = intervals().map((lvl) => lvl.filter(({ name }) => name))

  let min = levels[0][0].start
  let max = levels[0].slice(-1)[0].end

  $: scaling = 1

  $: pos = (r: number, v: number) => {
    const gap = 0.01

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
    const lvl = level.map(({ start, end, color }) => {
      const offset = 0.0001
      const startRel = Math.min(
        1,
        ((Math.max(start - (max - min) * offset, min) - min) / (max - min)) **
          scaling
      )
      const endRel = Math.min(
        1,
        ((Math.max(end + (max - min) * offset, min) - min) / (max - min)) **
          scaling
      )

      return {
        start,
        end,
        startRel,
        endRel,
        color,
        width: _spaceDist[i] * 45 - 1,
      }
    })

    const getParent = ({ start, end }) =>
      i === 0
        ? null
        : levels[i - 1].find((l) => l.start <= start && l.end >= end)

    let curParent = getParent(lvl[lvl.length - 1])

    for (let i = lvl.length - 1; i > 0; i--) {
      const nextParent = getParent(lvl[i - 1])

      if (curParent) {
        const skip = curParent !== nextParent
        curParent = nextParent
        if (skip) continue
      }

      if (lvl[i].endRel - lvl[i - 1].startRel >= 0.01) continue
      lvl[i].startRel = lvl[i - 1].startRel
      lvl.splice(i - 1, 1)
    }

    while (lvl.length >= 2 && lvl[0].endRel - lvl[0].startRel < 0.005) {
      lvl[1].startRel = lvl[0].startRel
      lvl.splice(0, 1)
    }
    while (
      lvl.length >= 2 &&
      lvl[lvl.length - 1].endRel - lvl[lvl.length - 1].startRel < 0.005
    ) {
      lvl[lvl.length - 2].endRel = lvl[lvl.length - 1].endRel
      lvl.splice(lvl.length - 1, 1)
    }

    return lvl.map(({ startRel, endRel, ...rest }) => {
      const [x1, y1] = pos(r, startRel)
      const [x2, y2] = pos(r, endRel)
      return {
        d: `M ${x1} ${y1} A ${r} ${r} 0 ${
          (x2 - x1) * (50 - y1) - (y2 - y1) * (50 - x1) > 0 ? 0 : 1
        } 1 ${x2} ${y2}`,
        ...rest,
      }
    })
  })

  let scrollAcc = 0

  const applyScroll = throttle(
    () => {
      scaling = Math.max(1, scaling + scaling * (scrollAcc / 1000))
      scrollAcc = 0
    },
    1000 / 30,
    {
      leading: false,
      trailing: true,
    }
  )

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

    if (
      'chrome' in window && wheelDeltaY
        ? wheelDeltaY === -3 * e.deltaY
        : e.deltaMode === 0
    ) {
      scrollAcc += wheelDeltaY
      applyScroll()
    } else scaling = Math.max(1, scaling + scaling * (wheelDeltaY / 1000))
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

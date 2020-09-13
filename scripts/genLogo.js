const intervals = require('../data/intervals.json')

const eons = intervals.filter(({ lvl }) => lvl === 1)
const eras = intervals.filter(({ lvl }) => lvl === 2)

let start = eons[0].start
let end = eons.slice(-1)[0].end
end += (end - start) * 0.07

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d

const pos = (r, v) => {
  return [
    50 + Math.sin(v * 2 * -Math.PI) * r,
    50 + Math.cos(v * 2 * -Math.PI) * r,
  ].map((v) => round(v))
}

const size = 100

const render = (set, radius) => {
  return set.map((interval) => {
    const [p1, p2] = [interval.start, interval.end].map((v) =>
      pos(radius, (v - start) / (end - start))
    )
    const d = `M ${p1[0]} ${p1[1]} A ${round(radius)} ${round(
      radius
    )} 0 ${0} 1 ${p2[0]} ${p2[1]}`
    return `<path d="${d}" stroke="${interval.color}"/>`
  })
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}px" height="${size}px" viewBox="0 0 ${size} ${size}" fill="none">
  <g stroke-width="17px" fill="none">
${render(eons, 16)
  .map((v) => ' '.repeat(4) + v)
  .join('\n')}
  </g>
  <g stroke-width="17px" fill="none">
${render(eras, 40)
  .map((v) => ' '.repeat(4) + v)
  .join('\n')}
  </g>
</svg>`

console.log(svg)
require('fs').writeFileSync(require('path').resolve(__dirname, 'logo.svg'), svg)

import data from '../../data/intervals.json'
import { blendHexColorString as blend } from './color'

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

export default (fillEmpty = false) => {
  const levels: (typeof data[number] & {
    txColor: string
  })[][] = Object.entries(byLvl)
    .sort(([k1], [k2]) => parseInt(k1) - parseInt(k2))
    .map(([, v]) => v) as any

  if (fillEmpty)
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

  return levels
}

const roundDec = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d

export function formatTimespan(n: number): string {
  const digits = Math.log10(n) | 0
  let num: number | string = n
  let quant: string

  if (digits >= 9) {
    num = roundDec(n / 1e9, digits === 9 ? 1 : 0)
    quant = 'billion'
  } else if (digits >= 6) {
    num = roundDec(n / 1e6, digits === 6 ? 1 : 0)
    quant = 'million'
  } else {
    num = roundDec(num, 0)
      .toString()
      .split('')
      .reverse()
      .join('')
      .match(/.{1,3}/g)
      .join('\u2009')
      .split('')
      .reverse()
      .join('')
  }

  return !quant ? num.toString() : `${num} ${quant}`
}

export function formatTimeStamp(n: number): string {
  if (n === 0) return 'now'
  if (n > 0) return n.toString()

  n *= -1
  const digits = Math.log10(n) | 0
  let num: number | string = n
  let quant: string

  if (digits >= 9) {
    num = roundDec(n / 1e9, 2)
    quant = 'BYA'
  } else if (digits >= 6) {
    num = roundDec(n / 1e6, 2)
    quant = 'MYA'
  } else if (digits >= 3) {
    num = roundDec(n / 1e3, 2)
    quant = 'KYA'
  } else num = Math.round(n)

  return !quant ? num.toString() : `${num}\u2009${quant}`
}

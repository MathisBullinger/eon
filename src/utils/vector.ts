export type Vector = [number, number]

export function mag(v: Vector): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2)
}

export function add(a: Vector, b: Vector): Vector {
  return [a[0] + b[0], a[1] + b[1]]
}

export function minus(a: Vector, b: Vector): Vector {
  return [a[0] - b[0], a[1] - b[1]]
}

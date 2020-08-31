const cache = {}

export const fetchArticle = async (name: string) => {
  if (name in cache) return cache[name]
  const { query } = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${encodeURIComponent(
      name
    )}&origin=*`
  ).then((res) => res.json())
  const data: any = Object.entries(query.pages).find(
    ([k, v]: [string, any]) => v && k === v.pageid?.toString()
  )?.[1]

  if (data.extract) {
    const node = document.createElement('div')
    node.innerHTML = data.extract
    node
      .querySelectorAll('[title~=pronunciation]')
      .forEach((node) => node.remove())

    const removeEmpty = (parent: HTMLElement) => {
      Array.from((parent.children as unknown) as HTMLElement[]).forEach(
        (node) => {
          removeEmpty(node)
          if (/^\s*$/.test((node as HTMLElement).innerHTML))
            return node.remove()
        }
      )
    }
    removeEmpty(node)

    data.extract = node.innerHTML.replace(/\(\s*\)/g, '')
  }

  return (cache[name] = data)
}

export const read = (name: string) => cache[name]

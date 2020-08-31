const cache = {}

export const fetchArticle = async (name: string) => {
  if (name in cache) return cache[name]
  const { query } = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${encodeURIComponent(
      name
    )}&origin=*`
  ).then((res) => res.json())
  return (cache[name] = Object.entries(query.pages).find(
    ([k, v]: [string, any]) => v && k === v.pageid?.toString()
  )?.[1])
}

export const read = (name: string) => cache[name]

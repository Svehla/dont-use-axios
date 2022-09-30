type QueryItem = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryItem | QueryItem[]>
const createQueryString = (params: QueryParams) => {
  const customQuery = new URLSearchParams()

  Object.entries(params).forEach(([k, value]) => {
    if (Array.isArray(value)) {
      value.forEach(valueItem => {
        customQuery.append(k, `${valueItem ?? ''}`)
      })
    } else {
      customQuery.append(k, `${value ?? ''}`)
    }
  })
  return customQuery.toString()
}

export const addQueryParams = (url: string, extra?: { queryParams?: QueryParams }) => {
  if (!extra?.queryParams) return url
  return `${url}?${createQueryString}`
}

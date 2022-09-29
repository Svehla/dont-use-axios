// ### 1. better TS types to have typed response

declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const ffetch = async <Data>(url: string, init?: Parameters<typeof fetch>[1] | undefined) => {
  const response = await fetch(url, init)
  return response as FFetchResponse<Data>
}

// -------------------------------------------------------

type APIData = {
  id: string
  value: string
}

const example = async () => {
  const res = await ffetch1<APIData>('https://api.chucknorris.io/jokes/random')
  const data = await res.json()
}

// -------------------------------------------------------

export const ffetch1 = ffetch
export const example1 = example

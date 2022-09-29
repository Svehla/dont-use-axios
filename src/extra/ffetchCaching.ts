// ### Extra: 1. Add HTTP caching

import stringify from 'fast-json-stable-stringify'
import { addMilliseconds, differenceInMilliseconds } from 'date-fns'

declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const _cache: Record<string, { cachedTime: Date; cachedPromisePointerRes: any }> = {}

const HTTP_CACHE_VALIDATION_TIME_MS = 3000

const isCacheValid = (cacheKey: string) => {
  if (!_cache[cacheKey]) {
    return false
  }

  const diff = differenceInMilliseconds(
    addMilliseconds(_cache[cacheKey].cachedTime, HTTP_CACHE_VALIDATION_TIME_MS),
    new Date()
  )

  return diff > 0
}

// fCacheFetch
const fetchWithCache = async <Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
  extra?: {
    useCache?: boolean
    cacheTimeout?: number
  }
): Promise<FFetchResponse<Data>> => {
  // turn on HTTP cache by default only for all GET Requests
  const isGetRequest = (init?.method ?? 'GET').toLocaleLowerCase() === 'get'

  const useCache = extra?.useCache === undefined && isGetRequest ? true : (extra?.useCache ?? false)

  // redundant calculation of cache key for non-cached data
  const cacheKey = stringify([url, init?.method, init?.body])

  if (useCache && isCacheValid(cacheKey)) {
    return (_cache[cacheKey].cachedPromisePointerRes as Promise<FFetchResponse<Data>>)
    	// make clone only for the non-first request
      // make uniq response clone for each user request
      .then(r => r.clone())
  }

  const responsePromise: Promise<FFetchResponse<Data>> = fetch(url, init) 

  if (useCache) {
    _cache[cacheKey] = {
      cachedTime: new Date(),
      // save pointer to unresolved promise into local cache
      cachedPromisePointerRes: responsePromise
    }
  }

  return responsePromise
}

class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res: Response) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

const ffetch = async <Data, ParsedResData = Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
	extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
    jsonBody?: Record<any, any>
    basicAuth?: { username: string, password: string }
    useCache?: boolean
    cacheTimeout?: number
	}
) => {

	const enhancedInit = { headers: {}, ...init }

  if (extra?.jsonBody) {
    enhancedInit.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    }
    enhancedInit.body = JSON.stringify(extra.jsonBody)
  }

  if (extra?.basicAuth) {
    enhancedInit.headers['Authorization'] = `Basic ${btoa(extra.basicAuth.username + ":" + extra.basicAuth.password)}`
  }

	const response = await fetchWithCache<Data>(url, enhancedInit, {
    useCache: extra?.useCache,
    cacheTimeout: extra?.cacheTimeout
  })

	if (!response.ok) throw new FErrorHTTPLayer(response)

	const isResponseJson = response.headers.get('content-type')?.includes('application/json')

	// you can't parse response for two times, before each parsing call the `.clone()` method
	const resToParse = response.clone()
	const data = (await (extra?.okResponseParser
		? extra.okResponseParser(resToParse)
		: isResponseJson
		? resToParse.json()
		: resToParse.text()) as Data
	)

	return [data, response] as const
}

// -------------------------------------------------------

type APIData = {
  "id": string
  "value": string
}

const doTheRequest = async (q = '') => {
  const [data] = await ffetch<APIData>(`https://api.chucknorris.io/jokes/random?q=${q}`)
  return data
}

const example = async () => {

  const allData = await Promise.all([
    doTheRequest(),
    doTheRequest('a'),
    doTheRequest('b'),
    doTheRequest('b'),
    doTheRequest('b'),
    doTheRequest(),
  ])
  console.log(allData)
}

// -------------------------------------------------------

export const ffetchCache = ffetch
export const exampleCache = example
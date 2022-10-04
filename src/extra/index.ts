declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

// global.fetch on steroids
export const trenFetch = async <Data, ParsedResData = Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
  extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
    jsonBody?: Record<any, any>
    basicAuth?: { username: string; password: string }
    useCache?: boolean
    cacheTimeout?: number
    timeout?: number
    queryParams?: QueryParams
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
    enhancedInit.headers['Authorization'] = `Basic ${btoa(
      extra.basicAuth.username + ':' + extra.basicAuth.password
    )}`
  }

  const superFetch1 = withTimeoutFetch(window.fetch, extra)
  const superFetch2 = withCacheFetch(superFetch1, extra)

  const urlWithQueryParams = addQueryParams(url, extra)
  const response = await superFetch2<Data>(urlWithQueryParams, enhancedInit)

  httpStatusLG299ErrorThrower(response)

  const parsedRes = parseResponse(response, extra)
  return parsedRes
}

// ~~~ http timeouts -------------------------------------------------------

// TODO: check if it works correctly
export const withTimeoutFetch =
  (localFetch: typeof fetch, options?: { timeout?: number }) =>
  async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1] | undefined) => {
    if (!options?.timeout) return fetch(url, init)

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort('TIMEOUT_ERROR'), options.timeout)
    try {
      const response = await localFetch(url, {
        ...init,
        signal: controller.signal,
      })
      return response
    } catch (err) {
      throw err
    } finally {
      clearTimeout(id)
    }
  }

// ~~~ query params -------------------------------------------------------

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

const addQueryParams = (url: string, extra?: { queryParams?: QueryParams }) => {
  if (!extra?.queryParams) return url
  return `${url}?${createQueryString}`
}

// ~~~ httpErrorThrower -------------------------------------------------------

export class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res: Response) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

const httpStatusLG299ErrorThrower = async <Data>(response: FFetchResponse<Data>) => {
  if (!response.ok) throw new FErrorHTTPLayer(response)
  return response
}

// ~~~ parse response -------------------------------------------------------

export const parseResponse = async <Data, ParsedResData = Data>(
  response: FFetchResponse<Data>,
  extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
  }
) => {
  const isResponseJson = response.headers.get('content-type')?.includes('application/json')
  const resToParse = response.clone() as FFetchResponse<Data>

  // you can't parse response for two times, before each parsing call the `.clone()` method
  const data = (await (extra?.okResponseParser
    ? extra.okResponseParser(resToParse)
    : isResponseJson
    ? resToParse.json()
    : resToParse.text())) as ParsedResData

  return [data, response] as const
}

// ~~~ HTTP caching -------------------------------------------------------

import { addMilliseconds, differenceInMilliseconds } from 'date-fns'
import stringify from 'fast-json-stable-stringify'

const _cache: Record<string, { cachedTime: Date; cachedPromisePointerRes: any }> = {}
// @ts-expect-error
window.ccc = _cache
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

export const withCacheFetch =
  (
    localFetch: typeof fetch,
    extra?: {
      useCache?: boolean
      cacheTimeout?: number
    }
  ) =>
  async <Data>(
    url: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1] | undefined
  ) => {
    // turn on HTTP cache by default only for all GET Requests
    const isGetRequest = (init?.method ?? 'GET').toLocaleLowerCase() === 'get'

    const useCache = extra?.useCache === undefined && isGetRequest ? true : extra?.useCache ?? false

    // redundant calculation of cache key for non-cached data
    const cacheKey = stringify([url, init?.method, init?.body])

    if (useCache && isCacheValid(cacheKey)) {
      // make clone only for the non-first request
      // make uniq response clone for each user request
      return (await _cache[cacheKey].cachedPromisePointerRes).clone() as Promise<
        FFetchResponse<Data>
      >
    }

    const responsePromise = localFetch(url, init) as Promise<FFetchResponse<Data>>

    if (useCache) {
      _cache[cacheKey] = {
        cachedTime: new Date(),
        // save pointer to unresolved promise into local cache
        cachedPromisePointerRes: responsePromise,
      }
    }

    return responsePromise
  }

// -------------------------------------------------------

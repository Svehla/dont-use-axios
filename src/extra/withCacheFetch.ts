// ### Extra: 1. Add HTTP caching

import { FFetchResponse } from './shared'
import { addMilliseconds, differenceInMilliseconds } from 'date-fns'
import stringify from 'fast-json-stable-stringify'

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

import { QueryParams, addQueryParams } from './queryString'
import { httpErrorThrower } from './httpErrorThrower'
import { parseResponse } from '../parseResponse'
import { withCacheFetch } from './withCacheFetch'
import { withTimeoutFetch } from './withTimeoutFetch'

declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const ffetch = async <Data, ParsedResData = Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
  extra?: {
    jsonBody?: Record<any, any>
    basicAuth?: { username: string; password: string }
    useCache?: boolean
    cacheTimeout?: number
    timeout?: number
    queryParams?: QueryParams
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
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

  httpErrorThrower(response)

  const parsedRes = parseResponse(response, extra)
  return parsedRes
}

// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------

export const ffetchMega = ffetch

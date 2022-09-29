import { withCacheFetch } from './withCacheFetch'
import { withHTTPErrsFetch } from './withHTTPErrsFetch'
import { withTimeoutFetch } from './withTimeoutFetch'

declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

// fetch layers
//   - cache
//   - timeout
//   - response parsers
//   - basic auth
//   - request JSON params
//   - throw error for `> 299` HTTP statuses

const ffetch = async <Data, ParsedResData = Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
  extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
    jsonBody?: Record<any, any>
    basicAuth?: { username: string; password: string }
    useCache?: boolean
    cacheTimeout?: number
    timeout?: number
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
  const superFetch3 = withHTTPErrsFetch(superFetch2)

  const response = await superFetch3<Data>(url, enhancedInit)

  const isResponseJson = response.headers.get('content-type')?.includes('application/json')

  // you can't parse response for two times, before each parsing call the `.clone()` method
  const resToParse = response.clone() as FFetchResponse<Data>
  const data = (await (extra?.okResponseParser
    ? extra.okResponseParser(resToParse)
    : isResponseJson
    ? resToParse.json()
    : resToParse.text())) as Data

  return [data, response] as const
}

// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------

export const ffetchAll = ffetch

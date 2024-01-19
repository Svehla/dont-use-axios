import { serializeNetworkFetchError } from './errors'

export class FFetchNetworkError extends Error {
  type = 'NetworkFFetchError'
  messageJson: {
    url: string
    method: any
    reason: any
    body: any
    query: any
  }

  constructor(error: Error, messageJson: { url: string; method: any; body: any; query: any }) {
    super(error.message)
    this.messageJson = {
      ...messageJson,
      reason: serializeNetworkFetchError(error),
    }
    this.type = 'NetworkFFetchError'

    // after typescript recompilation inheritance stops to work...
    // instanceof was not working in nodejs...
    // Object.setPrototypeOf(this, FFetchNetworkError.prototype)
    // Error.captureStackTrace(this, this.constructor)
  }
}

export class FFetchNotOKError extends Error {
  type = 'FFetchNotOKError'
  response: Response
  messageJson: {
    url: string
    status: number
    reason: any
  }

  constructor(messageJson: { url: string; status: number; reason: any }, response: Response) {
    const message = JSON.stringify(messageJson)
    super(message)
    this.messageJson = messageJson
    this.response = response
    this.type = 'FFetchNotOKError'

    // after typescript recompilation inheritance stops to work...
    // instanceof was not working in nodejs...
    // Object.setPrototypeOf(this, FFetchNotOKError.prototype)
    // Error.captureStackTrace(this, this.constructor)
  }
}

export const toQueryParams = (params: Record<string, any>) => {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => {
    search.append(k, v)
  })

  return search.toString()
}

// --- fix static types for network node-fetch library ---
export declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const get4xx5xxErrorMessage = async (res: Response) => {
  let reason = ''
  try {
    try {
      reason = await res.json()
    } catch (err) {
      reason = await res.text()
    }
  } catch (err) {
    reason = 'unknown reason'
  }

  return {
    url: res.url,
    status: res.status,
    reason,
  }
}

export const errorThrower = async <T>(res: FFetchResponse<T>) => {
  // ok is equal to `statusCode16,000.00 Kč` in range 200-299`
  if (res.ok) return
  throw new FFetchNotOKError(await get4xx5xxErrorMessage(res.clone()), res)
}

const jsonOkResponseParser = <M>(r: FFetchResponse<M>) => r.json()
const textOkResponseParser = <M>(r: FFetchResponse<M>) => r.text()

type FetchInit = Parameters<typeof fetch>[1] | undefined

export const ffetch = async <M>(
  url: string,
  method: NonNullable<FetchInit>['method'],
  {
    domain,
    okResponseParser,
    body,
    path = {},
    // formData,
    query,
    basicAuth,
  }: {
    domain: string
    okResponseParser?: (_arg: FFetchResponse<M>) => Promise<M>
    body?: any
    path?: Record<string, string>
    // formData?: Record<string, any>
    query?: Record<string, any>
    basicAuth?: { username: string; password: string } //
  },
  init: FetchInit = {
    mode: 'cors',
  }
): Promise<[M, FFetchResponse<M>]> => {
  // we want to be sure that each mock service is async function

  let modifiedUrl = url

  try {
    let response: FFetchResponse<M>
    const enhancedInit: FetchInit = {
      // WTF java API backend
      method: method?.toUpperCase(),
      // this is needed to make Set-cookie works for XHR requests + to send auth cookie back to the server
      // credentials: "include",
      ...init,
    }

    if (!enhancedInit.headers) {
      enhancedInit.headers = {}
    }

    // no-cors set
    if (body instanceof FormData) {
      enhancedInit.body = body
    } else if (body) {
      enhancedInit.headers = {
        'Content-Type': 'application/json',
        // TODO: should this header be for only .json parsers? doesn't matter right now...
        Accept: 'application/json',
        // set no-cors mode
        ...enhancedInit.headers,
      }
      enhancedInit.body = JSON.stringify(body)
    }

    if (basicAuth) {
      // @ts-expect-error
      enhancedInit.headers['Authorization'] = `Basic ${btoa(
        basicAuth.username + ':' + basicAuth.password
      )}`
    }

    // TODO: test if it works correctly...

    // modify URL with dynamic URL params
    modifiedUrl = Object.entries(path).reduce(
      (curr, [key, value]) => curr.replaceAll(`{${key}}`, value),
      modifiedUrl
    )

    modifiedUrl = [modifiedUrl, query ? `?${toQueryParams(query)}` : ''].join('')

    modifiedUrl = [domain, modifiedUrl].join('')

    response = await fetch(modifiedUrl, enhancedInit)

    // clone response in order to be able to read body more than once
    // see : https://stackoverflow.com/questions/40497859/reread-a-response-body-from-javascripts-fetch for more info

    await errorThrower(response)

    const isJson = response.headers.get('content-type')?.includes('application/json')

    const resToParse = response.clone()
    const okParsedData = await (okResponseParser
      ? okResponseParser(resToParse)
      : isJson
      ? jsonOkResponseParser(resToParse)
      : textOkResponseParser(resToParse))

    return [okParsedData, response]
  } catch (error) {
    if (error instanceof TypeError && error.cause) {
      // network related error
      throw new FFetchNetworkError(error, {
        url: modifiedUrl,
        method,
        body,
        query,
      })
    }

    throw error
  }
}

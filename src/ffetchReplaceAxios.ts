// ### Put all together

class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res: Response) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const ffetch = async <Data, ParsedResData = Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined,
  extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
    jsonBody?: Record<any, any>
    basicAuth?: { username: string; password: string } //
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

  const response = await fetch(url, enhancedInit)

  // ok is equal to `statusCode` in range 200-299`
  if (!response.ok) throw new FErrorHTTPLayer(response)

  const isResponseJson = response.headers.get('content-type')?.includes('application/json')

  // you can't parse response for two times, before each parsing call the `.clone()` method
  const resToParse = response.clone()
  const data = (await (extra?.okResponseParser
    ? extra.okResponseParser(resToParse)
    : isResponseJson
    ? resToParse.json()
    : resToParse.text())) as ParsedResData

  return [data, response] as const
}

export const ffetch6 = ffetch

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
    basicAuth?: { username: string, password: string } // 
	}
): Promise<[Data, FFetchResponse<Data>]> => {

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

	const response = await fetch(url, enhancedInit)

  // ok is equal to `statusCode` in range 200-299`
	if (!response.ok) throw new FErrorHTTPLayer(response)

	const isResponseJson = response.headers.get('content-type')?.includes('application/json')

	// you can't parse response for two times, before each parsing call the `.clone()` method
	const resToParse = response.clone()
	const data = await (extra?.okResponseParser
		? extra.okResponseParser(resToParse)
		: isResponseJson
		? resToParse.json()
		: resToParse.text()
	)

	return [data, response]
}

// -------------------------------------------------------

type ApiData = {
  "id": string
  "value": string
}

const example = async () => {
  const cases = [

    async () => {
      const [data, response] = await ffetch<ApiData>('https://api.chucknorris.io/jokes/random')
      console.log('data.1', Object.keys(data).length > 0)
      console.log('data.2', response instanceof Response)
    },

    async () => {
      try {
        await ffetch<ApiData>('https://api.chucknorris.io/xxxx')
      } catch(err) {
        // @ts-expect-error
        console.log('1.1', err.type === 'FErrorHTTPLayer')
        // @ts-expect-error
        console.log('1.2', err.response.status === 404)
      }
    },

    async () => {
      try {
        await ffetch('https://api.chucknorris.io/jokes/random', { method: 'POST' }, {
          jsonBody: {
            a: {
              b: 'c' 
            }
          }
        })
      } catch(err) {
        // @ts-expect-error
        console.log('HTTP error.1', err.response.status === 405)
      }
    },




    async () => {
      try {
        await ffetch('https://api.asdfasdf_xxxxxxxxxx.io')
      } catch(err) {
        // @ts-expect-error
        console.log('networkError.1', err.type !== 'FErrorHTTPLayer')
      }
    },

    async () => {
      await ffetch('https://api.chucknorris.io/jokes/random', {}, {
        basicAuth: {
          username: "John",
          password: "Doe"
        }
      })
    },
  ]

  cases.forEach(i => i())
}

// -------------------------------------------------------

export const ffetch6 = ffetch
export const example6 = example
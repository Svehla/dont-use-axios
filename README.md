
## Don't use axios


Sorry for the clickbite title. The full title should be: dont use axios and other redundnat libraries which use can implement by your hands in few lines of code.

If you're new javascript developer you can find out many tutorials. In a tipical tutorials people use axios to fetch data from the server. Why don't normal people use `fetch` which is implemented in the browsers for a few years.

There is a few nice features of axios
1. better TS types to have typed response
2. status > 299 throws new JS error
3. easily get data from the response without usage of `await response.json()`	
4. default support for POST body JSON content-type
5. Basic auth


what can't do axios as well as fetch API?

- httpsOverHttpProxy
- QueryParams
- HTTP timeouts
- cachin
- mocking
- logging
- authorizing token renewal
- redirect401

So it looks that axios can do many stuffs for us so why should not we use it?

Let's overview feature by feature and try to reimplement it on top of `fetch` function


## Reimplement axios by your own

### 1. better TS types to have typed response

```ts
declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const ffetch = async <Data>(
  url: string,
  init?: Parameters<typeof fetch>[1] | undefined
) => {
	const response = await fetch(url, init) 
	return response as FFetchResponse<Data>
}

```

as you can see, it only takes a few lines of code and now the `ffetch` is properly typed and you're able to 



### 2. status > 299 throws new JS error

```ts
class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

const ffetch = async (url, init) => {
	const response = await fetch(url, init)
	if (!response.ok) throw new FErrorHTTPLayer(response)
	return response
}
```



### 3. easily get data from the response without usage of `await response.json()`	

```ts
const ffetch = async (url, init, extra) => {
	const response = await fetch(url, init)

	const isResponseJson = response.headers.get('content-type')?.includes('application/json')

	const responseToParse = response.clone()
	const data = await (extra?.okResponseParser
		? extra.okResponseParser(responseToParse)
		: isResponseJson
		? responseToParse.json()
		: responseToParse.text()
	)

	return [data, response]
}
```


### 4. default support for POST body JSON content-type

```ts
const ffetch = async (url, init, extra) => {
	const enhancedInit = {
    ...(extra?.jsonBody 
      ? {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...init.headers,
        },
        body: JSON.stringify(extra.jsonBody),
      }
      : {}),
    ...init,
  }

	const response = await fetch(url, enhancedInit)

	return response
}
```


### 5. Basic auth

```ts
const ffetch = async (url, init, extra) => {
	const enhancedInit = { ...init }
  if (extra?.basicAuth) {
    enhancedInit.headers['Authorization'] = `Basic ${btoa(extra.basicAuth.username + ":" + extra.basicAuth.password)}`
  }
	const response = await fetch(url, enhancedInit)
	return response
}
```

### Put all together:

Now we can put all stuffs together and we get nice single source to fetch data with beautiful API and with 0 npm dependencies.

```ts
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

```

anddddd

## Extra service layer implementations

### Adding in memory client cache

### Add mocking

### Renew token authorizing

### Logging


## Extra

Fetch is included in 18 as an axperimental API so it looks that we will not need to use node-fetch in the near future


create service layer to have single source of true for your API requests
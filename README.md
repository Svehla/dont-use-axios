j

## Don't use axios

Full title should be: don't use axios and other redundnat libraries which use can reimplement in a few lines of code.

If you're new JavaScript developer you can find out many tutorials how to fetch data from the browser.
In a typical tutorial people uses axios to fetch backend data from the server.
My question is, why don't the authors of the tutorials use `axios` and not the build in `fetch`
which is implemented in the browsers for a few years.

I think that main sales point of axios are those nice stuffs which axios provide to us.

1. better TS types to have typed response
2. status > 299 throws new JS error
3. easily get data from the response without usage of `await response.json()`
4. default support for POST body JSON content-type
5. Basic auth

Great respect for `axios` but I think that it's really simple to reimplement all of those stuffs in 2022.

If you use this lightweight abstraction you'll not be locked by another vendor library and the complexity of
your project will be lower.

## Reimplement axios by your own

Let's overview feature by feature and try to reimplement it on top of `fetch` function

### 1. better TS types to have typed response

```ts
declare class FFetchResponse<T> extends Response {
  json(): Promise<T>
}

const ffetch = async <Data>(url: string, init?: Parameters<typeof fetch>[1] | undefined) => {
  const response = await fetch(url, init)
  return response as FFetchResponse<Data>
}
```

as you can see, it only takes a few lines of code and the `ffetch` wrapper around the `window.fetch`
is properly typed and you're able to parametrize the requesty by the Input generick.

### 2. status > 299 throws new JS error

If backend for example returns HTTP status > 299 it will throw new instance of `FErrorHTTPLayer`.
So when `fetch` does not throw a new Error you know that respnose is OK and you can work with the returned data.

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

When you are using `fetch` I found out that you have to parse response by my own.
So I think that it makes sense do a light abstraction will will parse the data by default and you don't care about the response
you can just read the data like this

```ts
const ffetch = async (url, init, extra) => {
  const response = await fetch(url, init)

  const isResponseJson = response.headers.get('content-type')?.includes('application/json')

  const responseToParse = response.clone()
  const data = await (extra?.okResponseParser
    ? extra.okResponseParser(responseToParse)
    : isResponseJson
    ? responseToParse.json()
    : responseToParse.text())

  return [data, response]
}
```

Usage:

```ts
const [data] = await ffetch('ttps://api.chucknorris.io/jokes/random')
```

### 4. default support for POST body JSON content-type

HTTP protocol does not support JSON body, so you have to setup `Content-Type` and you have to
stringify the body to send the data from the backend to the server.

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

One of features which you probably don't need but axios offers it is basic auth.
It could look magic but let's have a look how hard is to implement custom basic auth

```ts
const ffetch = async (url, init, extra) => {
  const enhancedInit = { ...init }
  if (extra?.basicAuth) {
    enhancedInit.headers['Authorization'] = `Basic ${btoa(
      extra.basicAuth.username + ':' + extra.basicAuth.password
    )}`
  }
  const response = await fetch(url, enhancedInit)
  return response
}
```

### Put all together:

Now we can put all stuffs together and we'll get nice `ffetch` function with beautiful API and with 0 npm dependencies.

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
    basicAuth?: { username: string; password: string } //
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
  const data = await (extra?.okResponseParser
    ? extra.okResponseParser(resToParse)
    : isResponseJson
    ? resToParse.json()
    : resToParse.text())

  return [data, response]
}
```

And that's all what I found that `axios` could bring us.
Nice stuff about this `ffetch` function is that if you need to implement something special for your app,
it's up to you which layer of abstraction you're gonna use.

I think that if you have option to replace a library with just a few dozen lines of code you should do it.
You'll get simplified dependency tree of your project and you can reimplement it by your own with emphasis to your application use-case.

// ### 4. default support for POST body JSON content-type

const ffetch = async (url, init, extra) => {

	const enhancedInit = { ...init }

  if (extra?.jsonBody) {
    enhancedInit.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    }
    enhancedInit.body = JSON.stringify(extra.jsonBody)
  }

	const response = await fetch(url, enhancedInit)

	return response
}

// -------------------------------------------------------

const example = async () => {
  const x = await ffetch('https://api.chucknorris.io/jokes/random', { method: 'POST' }, {
    jsonBody: {
      a: {
        b: 'c' 
      }
    }
  })
  console.log(x.status === 405)
}

// -------------------------------------------------------

export const ffetch4 = ffetch
export const example4 = example
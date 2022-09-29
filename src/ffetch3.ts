// ### 3. easily get data from the response without usage of `await response.json()`	

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


// -------------------------------------------------------


const example = async () => {
  const [data, response] = await ffetch('https://api.chucknorris.io/jokes/random', {}, {})
  console.log('data: ', data)
  console.log('response: ', response)
}


// -------------------------------------------------------

export const ffetch3 = ffetch
export const example3 = example
// ### 2. status > 299 throws new JS error

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


// -------------------------------------------------------

const example = async () => {
  try {
    const res = await ffetch('https://api.chucknorris.io/xxxxxx', {})
    const data = await res.json()
    console.log(data)
  } catch(err: any) {
    console.error(err)
    if (err.type === 'FErrorHTTPLayer') {
      const e = err as FErrorHTTPLayer
      const reason = JSON.parse(await e.response.text())
      console.info("Fetch error")
      console.info(reason)
    }
  }
}


// -------------------------------------------------------

export const ffetch2 = ffetch
export const example2 = example
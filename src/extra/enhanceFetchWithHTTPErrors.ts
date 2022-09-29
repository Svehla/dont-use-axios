import { FFetchResponse } from "./shared"

export class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res: Response) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

export const withHTTPErrsFetch = (localFetch: typeof fetch) => async <Data>(
  url: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1] | undefined,
)=> {
	const response = await localFetch(url, init) as FFetchResponse<Data>
	
	if (!response.ok) throw new FErrorHTTPLayer(response)
	return response
}
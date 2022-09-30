import { FFetchResponse } from './shared'

export class FErrorHTTPLayer extends Error {
  type = 'FErrorHTTPLayer'
  response: Response

  constructor(res: Response) {
    super(`${res.status.toString()} ${res.url}`)
    this.response = res
  }
}

export const httpErrorThrower = async <Data>(response: FFetchResponse<Data>) => {
  if (!response.ok) throw new FErrorHTTPLayer(response)
  return response
}

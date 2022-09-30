import { FFetchResponse } from './extra/shared'

export const parseResponse = async <Data, ParsedResData = Data>(
  response: FFetchResponse<Data>,
  extra?: {
    okResponseParser?: (arg: FFetchResponse<Data>) => Promise<ParsedResData>
  }
) => {
  const isResponseJson = response.headers.get('content-type')?.includes('application/json')
  const resToParse = response.clone() as FFetchResponse<Data>

  // you can't parse response for two times, before each parsing call the `.clone()` method
  const data = (await (extra?.okResponseParser
    ? extra.okResponseParser(resToParse)
    : isResponseJson
    ? resToParse.json()
    : resToParse.text())) as ParsedResData

  return [data, response] as const
}

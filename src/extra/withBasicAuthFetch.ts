// TODO: should I use it?
import { FFetchResponse } from './shared'

export const withBasicAuthFetch =
  (
    localFetch: typeof fetch,
    extra?: {
      basicAuth?: { username: string; password: string }
    }
  ) =>
  async <Data>(
    url: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1] | undefined
  ) => {
    // TODO: is that working properly?
    const enhancedInit = { headers: {}, ...init }

    if (extra?.basicAuth) {
      enhancedInit.headers['Authorization'] = `Basic ${btoa(
        extra.basicAuth.username + ':' + extra.basicAuth.password
      )}`
    }

    const response = (await localFetch(url, init)) as FFetchResponse<Data>

    return response
  }

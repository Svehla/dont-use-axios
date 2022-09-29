
// TODO: check if it works correctly
export const withTimeoutFetch = (
  localFetch: typeof fetch,
  options?: { timeout?: number }
) => async (
  url: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1] | undefined,
) => {
  if (!options?.timeout) {
    return fetch(url, init)
  }

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), options.timeout)
  try {
    const response = await localFetch(url, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (err) {
    throw err
  } finally {
    clearTimeout(id)
  }
}
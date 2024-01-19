import { FFetchNetworkError } from './ffetchReplaceAxios'

export const serializeNetworkFetchError = (error: TypeError) => ({
  type: error.name,
  message: error.message,
  cause: {
    // @ts-expect-error
    message: error.cause.message,
    // @ts-expect-error
    errno: error.cause.errno,
    // @ts-expect-error
    code: error.cause.code,
    // @ts-expect-error
    syscall: error.cause.syscall,
    // @ts-expect-error
    hostname: error.cause.hostname,
  },
})

export const serializeErrorToJSON = (error: any): any => {
  let errorDetails = {}

  if (error instanceof TypeError && error.cause) {
    // Handling specific properties for network-related errors from global.fetch
    errorDetails = serializeNetworkFetchError(error)
  } else if (
    // instance of custom error is bugged in nodejs + ts
    error.type === 'FFetchNotOKError'
    // error instanceof FFetchNotOKError
  ) {
    errorDetails = {
      type: error.type,
      message: error.messageJson,
      stack: error.stack,
    }
  } else if (error instanceof FFetchNetworkError) {
    errorDetails = {
      type: error.type,
      message: error.messageJson,
      stack: error.stack,
    }
  } else if (error instanceof Error) {
    // General error handling
    errorDetails = {
      type: 'Error',
      message: error.message,
      stack: error.stack,
    }
  } else {
    errorDetails = {
      type: 'value',
      message: error,
      stack: error.stack,
    }
  }

  return errorDetails
}

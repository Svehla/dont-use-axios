// ### 5. default support for POST body JSON content-type

const ffetch = async (url, init, extra) => {
  const enhancedInit = { headers: {}, ...init }
  if (extra?.basicAuth) {
    enhancedInit.headers['Authorization'] = `Basic ${btoa(
      extra.basicAuth.username + ':' + extra.basicAuth.password
    )}`
  }
  const response = await fetch(url, enhancedInit)
  return response
}

// -------------------------------------------------------

const example = async () => {
  const res = await ffetch(
    'https://api.chucknorris.io/jokes/random',
    {},
    {
      basicAuth: {
        username: 'John',
        password: 'Doe',
      },
    }
  )
  console.log(res)
}

// -------------------------------------------------------

export const ffetch5 = ffetch
export const example5 = example

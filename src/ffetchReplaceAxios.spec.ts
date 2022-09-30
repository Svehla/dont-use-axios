import { ffetch6 } from './ffetchReplaceAxios'

const ffetch = ffetch6

type ApiData = {
  id: string
  value: string
}

const example = async () => {
  const cases = [
    async () => {
      const [data, response] = await ffetch<ApiData>('https://api.chucknorris.io/jokes/random')
      console.log('data.1', Object.keys(data).length > 0)
      console.log('data.2', response instanceof Response)
    },

    async () => {
      try {
        await ffetch<ApiData>('https://api.chucknorris.io/xxxx')
      } catch (err) {
        // @ts-expect-error
        console.log('1.1', err.type === 'FErrorHTTPLayer')
        // @ts-expect-error
        console.log('1.2', err.response.status === 404)
      }
    },

    async () => {
      try {
        await ffetch(
          'https://api.chucknorris.io/jokes/random',
          { method: 'POST' },
          {
            jsonBody: {
              a: {
                b: 'c',
              },
            },
          }
        )
      } catch (err) {
        // @ts-expect-error
        console.log('HTTP error.1', err.response.status === 405)
      }
    },

    async () => {
      try {
        await ffetch('https://api.asdfasdf_xxxxxxxxxx.io')
      } catch (err) {
        // @ts-expect-error
        console.log('networkError.1', err.type !== 'FErrorHTTPLayer')
      }
    },

    async () => {
      await ffetch(
        'https://api.chucknorris.io/jokes/random',
        {},
        {
          basicAuth: {
            username: 'John',
            password: 'Doe',
          },
        }
      )
    },
  ]

  cases.forEach(i => i())
}

export const example6 = example

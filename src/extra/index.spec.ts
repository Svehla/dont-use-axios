import { trenFetch } from '.'

type APIData = {
  id: string
  value: string
}

const doTheRequest = async (q = '') => {
  const [data] = await trenFetch<APIData>(
    `https://api.chucknorris.io/jokes/random?q=${q}`,
    {},
    { basicAuth: { username: 'xxx', password: 'yyy' } }
  )
  return data
}

export const megaExample = async () => {
  const allData = await Promise.all([
    doTheRequest(),
    doTheRequest('a'),
    doTheRequest('b'),
    doTheRequest('b'),
    doTheRequest('b'),
    doTheRequest(),
  ])
  console.log(allData)
}

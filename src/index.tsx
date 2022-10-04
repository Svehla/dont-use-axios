import { createRoot } from 'react-dom/client'
import { example1 } from './ffetch1'
import { example2 } from './ffetch2'
import { example3 } from './ffetch3'
import { example4 } from './ffetch4'
import { example5 } from './ffetch5'
import { example6 } from './ffetchReplaceAxios.spec'
import { megaExample } from './extra/index.spec'
import { trenFetch } from './extra'
import React, { useEffect, useState } from 'react'

// example1()
// example2()
// example3()
// example4()
// example5()
// example6()
// megaExample()

const doTheRequest = async (q = '') => {
  const [data] = await trenFetch<{
    id: string
    value: string
  }>(
    `https://api.chucknorris.io/jokes/random#browsercacheKey=${q}`,
    {},
    { basicAuth: { username: 'xxx', password: 'yyy' } }
  )
  return data
}

const App = () => {
  const [data, setData] = useState([] as Awaited<ReturnType<typeof doTheRequest>>[])

  useEffect(() => {
    ;(async () => {
      const allData = await Promise.all([
        doTheRequest(),
        doTheRequest('a'),
        doTheRequest('b'),
        doTheRequest('b'),
        doTheRequest('b'),
        doTheRequest('c'),
        doTheRequest('c'),
        doTheRequest('c'),
        doTheRequest('c'),
        doTheRequest(),
      ])
      setData(allData)
    })()
  }, [])

  return (
    <div>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item.value}</li>
        ))}
      </ul>
    </div>
  )
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)

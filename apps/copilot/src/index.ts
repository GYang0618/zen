import { serve } from '@hono/node-server'
import dotenv from 'dotenv'

import copilotkitApp from './copilotkit'

dotenv.config()

import { Hono } from 'hono'

const app = new Hono()

app.route('/api/copilotkit', copilotkitApp)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve(
  {
    fetch: app.fetch,
    port: 3200
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

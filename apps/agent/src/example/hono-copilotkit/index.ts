import { serve } from '@hono/node-server'
import dotenv from 'dotenv'

import copilotkitApp from './copilotkit'

dotenv.config()

import { Hono } from 'hono'

const app = new Hono()

app.route('/copilotkit', copilotkitApp)

serve(
  {
    fetch: app.fetch, // 或者直接使用copilotkitApp.fetch
    port: 3200
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import MongodbConnect from './config/mongodb'

import v1 from './routes/v1'

await MongodbConnect()

const app = new Hono()

app.get('/ui', swaggerUI({ url: '/v1' }))

app.get('/', (c) => {
	return c.json({ message: '👋 World' })
})

app.route('/v1', v1)

Bun.serve({
	port: Bun.env.PORT || 3000,
	fetch: app.fetch,
})

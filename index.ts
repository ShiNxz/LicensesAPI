import { logger } from 'hono/logger'
import { Hono } from 'hono'

// Configs
import MongodbConnect from './config/mongodb'

// Routes
import v1 from './routes/v1'

await MongodbConnect()

const app = new Hono()

app.use(logger())

app.get('/', (c) => {
	return c.json({ message: '👋 World' })
})

app.route('/v1', v1)

Bun.serve({
	port: Bun.env.PORT || 3000,
	fetch: app.fetch,
})

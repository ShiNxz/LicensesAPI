import { logger } from 'hono/logger'
import { Hono } from 'hono'
import cron from 'node-cron'

// Configs
import MongodbConnect from './config/mongodb'
import { Tasks as PaypalTasks } from './config/paypal'

// Routes
import v1 from './routes/v1'
import { Tasks } from './tasks/ValidateLicenses'

await MongodbConnect()

PaypalTasks.init()
await PaypalTasks.createProducts()
await Tasks.validateLicenses()

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

// Every 2 minutes
cron.schedule('*/2 * * * *', () => Tasks.validateLicenses(), {
	timezone: 'Asia/Jerusalem',
})

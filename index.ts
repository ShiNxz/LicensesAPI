import { logger } from 'hono/logger'
import { Hono } from 'hono'
import cron from 'node-cron'

// Configs
import MongodbConnect from './config/mongodb'

// Tasks
import { Tasks as PaypalTasks } from './config/paypal'
import { Tasks } from './tasks/ValidateLicenses'

// Routes
import v1 from './routes/v1'

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

// Every 24 hours
const day = '0 0 * * *'
cron.schedule(day, () => Tasks.validateLicenses())

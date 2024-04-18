import { Hono } from 'hono'

const hosts = new Hono()

hosts.get('/', (c) => {
	return c.json({ message: '👋 World' })
})

export default hosts

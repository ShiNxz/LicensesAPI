import { Hono } from 'hono'
import Host from '~/models/Hosts'

const hosts = new Hono()

hosts.get('/', async (c) => {
	const allHosts = await Host.find()

	return c.json(allHosts)
})

hosts.post('/', async (c) => {
	const { identifier } = c.body

	const newHost = await Host.create({ identifier })

	return c.json(newHost)
})

export default hosts

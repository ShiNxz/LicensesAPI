import { Hono } from 'hono'
import { hostSchema, type hostSchemaType } from '~/schemas/HostSchema'
import BodyValidator from '~/middlewares/BodyValidator'
import Host from '~/models/Hosts'

// Controllers
import RegisterHost from '~/controllers/v1/hosts/RegisterHost'
import GetSpecficHost from '~/controllers/v1/hosts/GetSpecficHost'
import GetAllHosts from '~/controllers/v1/hosts/GetAllHosts'

const hosts = new Hono()

/**
 * Get all hosts from the database
 */
hosts.get('/', GetAllHosts)

/**
 * Get a host by its identifier
 */
hosts.get('/:identifier', async (c) => {
	try {
		const identifier = c.req.param('identifier')
		const host = await Host.findOne({
			identifier,
		})

		if (!host) return c.json({ error: 'Host not found' }, 404)

		return c.json(host)
	} catch (error) {
		return c.json({ error: 'Host not found' }, 404)
	}
})

/**
 * Register a new host to the database
 */
hosts.post('/', BodyValidator(hostSchema), RegisterHost)

export default hosts

import { Hono } from 'hono'
import { hostSchema } from '~/schemas/HostSchema'
import BodyValidator from '~/middlewares/BodyValidator'
import TokenMiddleware from '~/middlewares/Token'
import Host from '~/models/Host'

// Advanced Controllers
import RegisterHost from '~/controllers/v1/hosts/RegisterHost'

const hosts = new Hono()

/**
 * Get all hosts from the database
 */
hosts.get('/', TokenMiddleware(), async (c) => {
	const allHosts = await Host.find()

	return c.json(allHosts)
})

/**
 * Get an host by its identifier
 */
hosts.get('/:identifier', TokenMiddleware(), async (c) => {
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
 * @public
 * Register a new host to the database
 */
hosts.post('/', BodyValidator(hostSchema), RegisterHost)

/**
 * Delete a host by its identifier
 */
hosts.delete('/:identifier', TokenMiddleware(), async (c) => {
	const identifier = c.req.param('identifier')

	const deletedHost = await Host.findOneAndDelete({ identifier })

	if (!deletedHost) return c.json({ error: 'Host not found' }, 404)

	return c.text('', 204)
})

export default hosts

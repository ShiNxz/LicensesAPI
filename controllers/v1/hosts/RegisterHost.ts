import type { Context } from 'hono'
import Host from '~/models/Hosts'
import type { hostSchemaType } from '~/schemas/HostSchema'

const RegisterHost = async (c: Context) => {
	const { identifier } = await c.req.json<hostSchemaType>()

	const newHost = await Host.create({ identifier })

	return c.json(newHost)
}

export default RegisterHost

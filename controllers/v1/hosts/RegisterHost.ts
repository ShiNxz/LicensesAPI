import type { hostSchemaType } from '~/schemas/HostSchema'
import type { Context } from 'hono'
import Host from '~/models/Host'

const RegisterHost = async (c: Context) => {
	const { identifier, additionalFields } = await c.req.json<hostSchemaType>()

	// Check if the host is already registered, if not, create a new one
	const newHost = await Host.findOneAndUpdate(
		{ identifier },
		{
			additionalFields,
		},
		{ upsert: true, new: true }
	)

	return c.json(newHost)
}

export default RegisterHost

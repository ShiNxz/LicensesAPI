import type { Context } from 'hono'
import Host from '~/models/Hosts'

const GetAllHosts = async (c: Context) => {
	const allHosts = await Host.find()

	return c.json(allHosts)
}

export default GetAllHosts

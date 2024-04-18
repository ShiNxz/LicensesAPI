import { Hono } from 'hono'
import hosts from './hosts'
import licenses from './licenses'

const v1 = new Hono()

v1.get('/', (c) => {
	return c.json({ message: '👋 World' })
})

v1.route('/hosts', hosts)
v1.route('/licenses', licenses)

export default v1

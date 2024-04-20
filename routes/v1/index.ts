import { Hono } from 'hono'
import licenses from './licenses'
import modules from './modules'
import hosts from './hosts'

const v1 = new Hono()

v1.get('/', (c) => {
	return c.json({ message: '👋 World' })
})

v1.route('/hosts', hosts)
v1.route('/modules', modules)
v1.route('/licenses', licenses)

export default v1

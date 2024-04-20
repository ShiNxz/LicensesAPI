import { Hono } from 'hono'
import { licenseSchema } from '~/schemas/LicenseSchema'
import BodyValidator from '~/middlewares/BodyValidator'
import TokenMiddleware from '~/middlewares/Token'
import License from '~/models/License'
import Module from '~/models/Module'
import Host from '~/models/Host'

// Advanced Controllers
import StartLicense from '~/controllers/v1/licenses/StartLicense'
import CheckPayment from '~/controllers/v1/licenses/CheckPayment'

const licenses = new Hono()

/**
 * Get all the licenses from the database
 */
licenses.get('/', TokenMiddleware(), async (c) => {
	const { status } = c.req.query()

	const allLicenses = await License.find(status ? { status: status.toUpperCase() } : {})

	return c.json(allLicenses)
})

/**
 * @public
 * Check if a license is active
 * Used to check if a host has access to a module
 */
licenses.get('/:moduleId/check', async (c) => {
	try {
		const moduleId = c.req.param('moduleId')
		const { host: hostId } = c.req.query()

		const module = await Module.findOne({ identifier: moduleId })
		if (!module) return c.json({ error: 'Module not found' }, 404)

		const host = await Host.findOne({ identifier: hostId })
		if (!host) return c.json({ error: 'Host not found' }, 404)

		const license = await License.findOne({
			host,
			module,
			status: 'ACTIVE',
		})

		if (!license) return c.json({ error: 'License not found' }, 404)

		const licenseStatus = {
			startDate: license.startDate,
			lastPayment: license.payments[license.payments.length - 1],
			type: license.type,
			token: license.token,
		}

		return c.json(licenseStatus)
	} catch (error) {
		console.error(error)
		return c.json({ error: 'An error occurred' }, 500)
	}
})

/**
 * @public
 * Check if a license is active by its token
 */
licenses.get('/:token', async (c) => {
	try {
		const token = c.req.param('token')

		const license = await License.findOne({
			token,
			status: 'ACTIVE',
		})
			.populate({ path: 'host', select: 'identifier additionalFields' })
			.populate({
				path: 'module',
				select: 'name identifier categories version description paymentCycle monthlyPrice yearlyPrice price',
			})

		if (!license) return c.json({ error: 'License not found' }, 404)

		const licenseStatus = {
			startDate: license.startDate,
			lastPayment: license.payments[license.payments.length - 1],
			type: license.type,
			token: license.token,
			host: license.host,
			module: license.module,
		}

		return c.json(licenseStatus)
	} catch (error) {
		console.error(error)
		return c.json({ error: 'An error occurred' }, 500)
	}
})

/**
 * @public
 * Start a license process for a module by its identifier
 */
licenses.post('/start', BodyValidator(licenseSchema), StartLicense)

/**
 * @public
 * Check the payment status of a license
 * Used to check if the payment was successful and start the license
 * Used as a return url for the payment process
 */
licenses.get('/check-payment', CheckPayment)

/**
 * @public
 * Cancel the payment and set the license status to CANCELLED
 */
licenses.get('/cancel-payment', async (c) => {
	const subscription_id = c.req.query('subscription_id')

	const license = await License.findOne({
		'payments.info.id': subscription_id,
		'status': 'PENDING',
	})

	if (!license) return c.json({ error: 'License not found' }, 404)

	license.status = 'CANCELED'
	await license.save()

	return c.json({ message: 'License canceled' })
})

export default licenses

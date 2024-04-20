import type { licenseSchemaType } from '~/schemas/LicenseSchema'
import type { Context } from 'hono'
import { CreateOrder, StartSubscriptionFlow } from '~/config/paypal'
import License from '~/models/License'
import Module from '~/models/Module'
import Host from '~/models/Host'

const StartLicense = async (c: Context) => {
	try {
		const { hostId, moduleId, cycle, returnUrl } = await c.req.json<licenseSchemaType>()

		const module = await Module.findOne({ identifier: moduleId })
		if (!module) return c.json({ error: 'Module not found' }, 404)

		const host = await Host.findOne({ identifier: hostId })
		if (!host) return c.json({ error: 'Host not found' }, 404)

		// Check if the host already has a license for the module and its ACTIVE
		const licenseExists = await License.findOne({
			host,
			module,
			status: 'ACTIVE',
		})

		if (licenseExists) return c.json({ error: 'a license is already active for this host and module' }, 409)

		// Check if the module supports the requested cycle
		if (!module.paymentCycle.includes(cycle)) return c.json({ error: 'Cycle not supported' }, 400)

		// Generate a uuid token
		const token = crypto.randomUUID()

		const isFreeModule = module.price === 0 && module.paymentCycle.includes('FREE')

		// If the module is free, create the license without starting a payment process
		if (isFreeModule) {
			const license = await License.create({
				module,
				host,
				token,
				status: 'ACTIVE',
				type: cycle,
			})

			return c.json(license)
		}

		// If there are PENDING licenses, remove them to avoid duplicates
		await License.deleteMany({
			host,
			module,
			status: 'PENDING',
		})

		switch (cycle) {
			case 'FREE': {
				if (!isFreeModule) return c.json({ error: 'Module is not free' }, 400)

				const license = await License.create({
					module,
					host,
					token,
					status: 'ACTIVE',
					type: cycle,
				})

				return c.json(license)
			}

			case 'TRIAL': {
				return c.json({ error: 'Not implemented yet' })
			}

			case 'ONE_TIME': {
				try {
					const order = await CreateOrder(module, returnUrl)

					const paymenLink = order.links.find((link) => link.rel === 'approve')
					if (!paymenLink) return c.json({ error: "Couldn't get paypal link" }, 500)

					await License.create({
						module,
						host,
						token,
						status: 'PENDING',
						type: cycle,
						payments: [
							{
								amount: 10,
								date: new Date(),
								info: order,
							},
						],
					})

					// Return the payment link to the user
					return c.text(paymenLink.href)
				} catch (error) {
					console.error(error)
					return c.json({ error: "Couldn't get paypal link" }, 500)
				}
			}

			case 'MONTHLY':
			case 'YEARLY': {
				const subscription = await StartSubscriptionFlow(host, module, cycle, returnUrl)
				if (!subscription) return c.json({ error: 'Subscription failed' }, 500)

				await License.create({
					module,
					host,
					token,
					status: 'PENDING',
					type: cycle,
					payments: [
						{
							amount: module.price,
							date: new Date(),
							info: subscription,
						},
					],
					subscription,
				})

				const subscriptionLink = subscription.links?.find((link) => link.rel === 'approve')
				if (!subscriptionLink || !subscriptionLink.href)
					return c.json({ error: 'Subscription link not found' }, 500)

				return c.text(subscriptionLink.href)
			}
		}
	} catch (error) {
		console.error(error)
		return c.json({}, 500)
	}
}

export default StartLicense

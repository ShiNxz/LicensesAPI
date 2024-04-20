import type { Context } from 'hono'
import { Orders } from 'paypal-jsdk'
import License from '~/models/License'

const CheckPayment = async (c: Context) => {
	try {
		const token = c.req.query('token')
		const returnUrl = c.req.query('returnUrl')
		const subscriptionId = c.req.query('subscription_id')

		if (!token) return c.json({ error: 'Token is required' }, 400)

		// Check if there is a pending license with the PayPal token inside the paymnets array
		const license = await License.findOne({
			'payments.info.id': subscriptionId ? subscriptionId : token,
			'status': 'PENDING',
		})
		if (!license) return c.json({ error: 'License not found' }, 404)

		const order = subscriptionId ? await Orders.showDetails(token) : await Orders.capturePayment(token)
		if (order.status !== 'COMPLETED' && order.status !== 'APPROVED') return c.text('Payment failed', 400)

		license.payments.push({
			// @ts-ignore
			amount: Number(order.purchase_units[0]?.payments?.captures[0]?.amount?.value || 0),
			date: new Date(),
			info: order,
		})

		license.status = 'ACTIVE'
		await license.save()

		if (returnUrl) {
			return c.redirect(returnUrl)
		}

		// Redirect the user to the success page
		return c.json({ message: 'Payment successful' })
	} catch (error) {
		console.error(error)
		return c.text('Payment failed', 500)
	}
}

export default CheckPayment

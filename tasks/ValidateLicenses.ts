import { Subscriptions } from 'paypal-jsdk'
import License from '~/models/License'

const ValidateLicenses = async () => {
	try {
		// Filter by few types
		const licenses = await License.find({
			status: 'ACTIVE',
			$or: [{ type: 'FREE' }, { type: 'MONTHLY' }, { type: 'YEARLY' }, { type: 'TRIAL' }],
		}).populate('module')

		// Validate the licenses
		for await (const license of licenses) {
			console.log(`Validating license ${license._id}`)

			// Validate the license
			const module = license.module
			if (!module) {
				console.error(`Module not found for license ${license._id}`)
				license.status = 'CANCELED'
				await license.save()
				break
			}

			switch (license.type) {
				case 'TRIAL': {
					// Implement the trial validation
					break
				}

				case 'MONTHLY':
				case 'YEARLY': {
					const subscription = license.subscription
					if (!subscription) {
						console.error(`Subscription not found for license ${license._id}`)
						license.status = 'CANCELED'
						await license.save()
						break
					}

					const subscriptionId = subscription.id!

					// Check the subscription status
					// Get the date 31 days ago
					const currentDate = new Date()
					const lastMonth = new Date(currentDate)
					lastMonth.setDate(lastMonth.getDate() - 31)

					const subscriptionTransactions = await Subscriptions.listTransactions(subscriptionId, {
						start_time: lastMonth.toISOString(),
						end_time: currentDate.toISOString(),
					})

					const filteredTransactions = subscriptionTransactions.transactions.filter(
						(transaction) => transaction.status === 'COMPLETED'
					)

					const lasttransaction = filteredTransactions[filteredTransactions.length - 1]
					if (!lasttransaction) {
						console.error(`No transactions found for subscription ${subscriptionId}`)
						license.status = 'INACTIVE'
						await license.save()
						break
					}
				}
			}
		}
	} catch (error) {
		console.error(`Error validating licenses`, error)
	}
}

export const Tasks = {
	validateLicenses: ValidateLicenses,
}

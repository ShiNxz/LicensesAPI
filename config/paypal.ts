import type { Module as ModuleType } from '../models/Module'
import type { Host } from '../models/Host'
import { Init, Orders, Plans, Products, Subscriptions } from 'paypal-jsdk'
import Module from '../models/Module'

const init = () => {
	if (!Bun.env.PAYPAL_CLIENT_ID || !Bun.env.PAYPAL_CLIENT_SECRET) {
		console.error('Paypal client id and secret are required')
		process.exit(1)
	}

	Init(Bun.env.PAYPAL_CLIENT_ID, Bun.env.PAYPAL_CLIENT_SECRET, (Bun.env.PAYPAL_MODE as 'LIVE' | 'SANDBOX') || 'LIVE')
}

export const CreateOrder = async (module: ModuleType, returnUrl?: string) => {
	try {
		const price = module.price
		if (!price) throw new Error('Module is free')

		// Format the price to 2 decimal places
		const formattedPrice = price.toFixed(2)

		const order = await Orders.create({
			intent: 'CAPTURE',
			application_context: {
				return_url: `${Bun.env.HOST}/v1/licenses/check-payment${returnUrl ? `?returnUrl=${returnUrl}` : ''}`,
			},
			purchase_units: [
				{
					amount: {
						currency_code: Bun.env.CURRENCY || 'USD',
						value: formattedPrice,
						breakdown: {
							item_total: {
								currency_code: Bun.env.CURRENCY || 'USD',
								value: formattedPrice,
							},
						},
					},
					items: [
						{
							name: `${module.name} License`,
							quantity: '1',
							unit_amount: {
								currency_code: Bun.env.CURRENCY || 'USD',
								value: formattedPrice,
							},
							category: 'DIGITAL_GOODS',
						},
					],
				},
			],
		})

		return order
	} catch (error) {
		throw error
	}
}

export const CreatePlan = async (module: ModuleType, type: 'MONTHLY' | 'YEARLY') => {
	try {
		// Get the product id
		const product = await Products.details(module._id.toString()).catch(() => {})
		if (!product) throw new Error('Product not found')

		const planId = `${module._id.toString()}-${type.toLowerCase()}`

		let plan = await Plans.details(planId)
			.then((plan) => {
				// Check if we need to update the plan price
				const price = type === 'MONTHLY' ? module.monthlyPrice : module.yearlyPrice
				if (!price) throw new Error('Price not found')

				const formattedPrice = price.toFixed(2)

				if (plan.billing_cycles[0]?.pricing_scheme?.fixed_price?.value !== formattedPrice) {
					console.log(`Updating plan price for ${module.name}`)
					return Plans.updatePricing(planId, [
						{
							billing_cycle_sequence: 1,
							pricing_scheme: {
								fixed_price: {
									value: formattedPrice,
									currency_code: Bun.env.CURRENCY || 'USD',
								},
							},
						},
					])
				}
			})
			.catch(async () => {
				console.log(`Plan not found for ${module.name} - ${type}, creating one...`)

				const price = type === 'MONTHLY' ? module.monthlyPrice : module.yearlyPrice
				if (!price) throw new Error('Price not found')

				const newPlan = await Plans.create({
					product_id: product.id!,
					name: `${module.name} ${type} Subscription`,
					billing_cycles: [
						{
							frequency: {
								interval_unit: type === 'MONTHLY' ? 'MONTH' : 'YEAR',
								interval_count: 1,
							},
							tenure_type: 'REGULAR',
							sequence: 1,
							pricing_scheme: {
								fixed_price: {
									value: price.toFixed(2),
									currency_code: Bun.env.CURRENCY || 'USD',
								},
							},
						},
					],
					payment_preferences: {
						setup_fee_failure_action: 'CANCEL',
					},
				})

				return newPlan
			})

		if (!plan) throw new Error('Plan not found and could not be created')

		console.log(`Plan for ${module.name} created`)

		return plan
	} catch (error) {
		throw error
	}
}

/**
 * Map through the modules and create a product for each one
 */
const createProducts = async () => {
	try {
		const modules = await Module.find()

		for await (const module of modules) {
			const isProductExist = await Products.details(module._id.toString()).catch(() => {})
			if (isProductExist) {
				console.log(`Product ${module.name} already exists, updating the plans...`)

				// Create the monthly subscription plan
				if (module.paymentCycle.includes('MONTHLY') && module.monthlyPrice) await CreatePlan(module, 'MONTHLY')

				// Create the yearly subscription plan
				if (module.paymentCycle.includes('YEARLY') && module.yearlyPrice) await CreatePlan(module, 'YEARLY')

				continue
			}

			console.log(`Creating product for ${module.name}`)
			await Products.create({
				name: `${module.name} License`,
				type: 'DIGITAL',
				id: module._id.toString(),
			})

			console.log(`Product ${module.name} created`)

			// Create the monthly subscription plan
			if (module.paymentCycle.includes('MONTHLY') && module.monthlyPrice) await CreatePlan(module, 'MONTHLY')

			// Create the yearly subscription plan
			if (module.paymentCycle.includes('YEARLY') && module.yearlyPrice) await CreatePlan(module, 'YEARLY')
		}
	} catch (error) {
		console.error(`Error creating plans`, error)
	}
}

const getPlan = async (module: ModuleType, type: 'MONTHLY' | 'YEARLY') => {
	try {
		const productId = module._id.toString()
		console.log({ productId })

		const { plans } = await Plans.list({
			total_required: true,
			product_id: productId,
		})

		console.log({ plans })

		if (!plans) return null

		const plan = plans.find((plan) => plan.name.includes(type))

		return plan ? plan : null
	} catch (error) {
		throw error
	}
}

export const StartSubscriptionFlow = async (
	host: Host,
	module: ModuleType,
	type: 'MONTHLY' | 'YEARLY',
	returnUrl?: string
) => {
	try {
		const plan = await getPlan(module, type)
		if (!plan) throw new Error('Plan not found')

		const subscription = await Subscriptions.create(plan.id, {
			custom_id: host._id.toString(),
			application_context: {
				return_url: `${Bun.env.HOST}/v1/licenses/check-payment${returnUrl ? `?returnUrl=${returnUrl}` : ''}`,
				cancel_url: `${Bun.env.HOST}/v1/licenses/cancel-payment${returnUrl ? `?returnUrl=${returnUrl}` : ''}`,
			},
		})

		return subscription
	} catch (error) {
		throw error
	}
}

export const Tasks = {
	init,
	createProducts,
}

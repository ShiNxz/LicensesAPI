import { models, model, Schema, type Model } from 'mongoose'

export const ModulePaymentCycles = ['MONTHLY', 'YEARLY', 'ONE_TIME', 'FREE', 'TRIAL'] as const

// Get the type of the payment cycle
export type PaymentCycle = (typeof ModulePaymentCycles)[number]

export interface Module extends Document {
	_id: string
	/**
	 * The name of the module
	 */
	name: string
	/**
	 * The identifier of the module
	 */
	identifier: string
	/**
	 * The module categories to filter by
	 */
	categories: string
	/**
	 * The version of the module
	 */
	version: number
	/**
	 * The description of the module
	 */
	description: string
	/**
	 * Paymnet cycles of the module
	 * @example ['MONTHLY', 'YEARLY', 'ONE-TIME', 'FREE', 'TRIAL']
	 */
	paymentCycle: PaymentCycle[]
	/**
	 * The monthly price of the module
	 * @example 5.99
	 * @example 0
	 */
	monthlyPrice?: number
	/**
	 * The yearly price of the module
	 * @example 25.99
	 * @example 0
	 */
	yearlyPrice?: number
	/**
	 * The one time price of the module
	 * if paymentCycle includes 'FREE' and the price is 0, the module will be free
	 */
	price?: number
	/**
	 * Showcase can be either image or video link
	 * @example 'https://example.com/image.png'
	 */
	showcase?: string
}

const ModuleSchema = new Schema(
	{
		name: String,
		identifier: { type: String, required: true, unique: true },
		categories: [String],
		version: Number,
		description: String,
		paymentCycle: [String],
		monthlyPrice: Number,
		price: Number,
		showcase: String,
	},
	{
		collection: 'Modules',
	}
)

const Module: Model<Module> = models.Module || model<Module>('Module', ModuleSchema)
export default Module

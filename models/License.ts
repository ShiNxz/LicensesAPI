import type { CreatedSubscription, Orders } from 'paypal-jsdk'
import type { Module, PaymentCycle } from './Module'
import type { Host } from './Host'
import { models, model, Schema, type Model } from 'mongoose'

export const LicenseStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELED'] as const
export type LicenseStatus = (typeof LicenseStatuses)[number]

export interface License extends Document {
	_id: string
	/**
	 * Host relation
	 */
	host: Host
	/**
	 * Module relation
	 */
	module: Module
	/**
	 * The token/code of the license
	 */
	token: string
	/**
	 * The license billing type
	 */
	type: PaymentCycle
	/**
	 * Payments history
	 */
	payments: {
		amount: number
		date: Date
		info: Awaited<ReturnType<typeof Orders.create>> | Awaited<ReturnType<typeof Orders.capturePayment>>
	}[]
	/**
	 * The starting date of the license
	 */
	startDate: Date
	/**
	 * The last payment date, relavant for monthly and yearly payments
	 */
	lastPayment: Date
	/**
	 * The status of the license
	 */
	status: LicenseStatus
	/**
	 * The subscription of the license
	 */
	subscription?: CreatedSubscription
}

const LicenseSchema = new Schema(
	{
		host: { type: Schema.Types.ObjectId, ref: 'Host' },
		module: { type: Schema.Types.ObjectId, ref: 'Module' },
		token: String,
		type: String,
		payments: {
			type: [
				{
					amount: Number,
					date: Date,
					info: Object,
				},
			],
			default: [],
		},
		startDate: {
			type: Date,
			default: Date.now,
		},
		lastPayment: Date,
		status: String,
		subscription: Object,
	},
	{
		collection: 'Licenses',
	}
)

const License: Model<License> = models.License || model<License>('License', LicenseSchema)
export default License

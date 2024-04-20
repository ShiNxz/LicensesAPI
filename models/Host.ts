import { models, model, Schema, type Model } from 'mongoose'

export interface Host extends Document {
	_id: string
	/**
	 * Can be a domain, IP address, or token
	 */
	identifier: string
	/**
	 * Some additional fields
	 * @example { phone: string }
	 */
	additionalFields?: Record<string, string>
	/**
	 * We can add more fields here if needed
	 */
}

const HostSchema = new Schema(
	{
		identifier: String,
		additionalFields: Object,
	},
	{
		collection: 'Hosts',
	}
)

const Host: Model<Host> = models.Host || model<Host>('Host', HostSchema)
export default Host

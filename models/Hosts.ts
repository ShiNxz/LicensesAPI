import { models, model, Schema, Model } from 'mongoose'

export interface Host extends Document {
	_id: string
	/**
	 * Can be a domain, IP address, or token
	 */
	identifier: string
}

const HostSchema = new Schema(
	{
		identifier: String,
	},
	{
		collection: 'Hosts',
	}
)

const Host: Model<Host> = models.Host || model<Host>('Host', HostSchema)
export default Host

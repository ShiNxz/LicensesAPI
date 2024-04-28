import { z } from 'zod'
import { ModulePaymentCycles } from '~/models/Module'

export const moduleSchema = z.object({
	name: z.string().min(1),
	identifier: z.string().min(1),
	categories: z.array(z.string()),
	version: z.string().min(1),
	description: z.string().min(1),
	paymentCycle: z.array(z.enum(ModulePaymentCycles)),
	monthlyPrice: z.number().optional(),
	price: z.number().optional(),
	showcase: z.string().optional(),
})

export const moduleSchemaPartial = moduleSchema.partial()

export type moduleSchemaType = z.infer<typeof moduleSchema>

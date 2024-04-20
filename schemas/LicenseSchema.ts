import { z } from 'zod'
import { ModulePaymentCycles } from '~/models/Module'

export const licenseSchema = z.object({
	cycle: z.enum(ModulePaymentCycles),
	hostId: z.string(),
	moduleId: z.string(),
	returnUrl: z.string().optional(),
})

export type licenseSchemaType = z.infer<typeof licenseSchema>

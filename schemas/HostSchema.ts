import { z } from 'zod'

export const hostSchema = z.object({
	identifier: z.string(),
	additionalFields: z.record(z.unknown()),
})

export type hostSchemaType = z.infer<typeof hostSchema>

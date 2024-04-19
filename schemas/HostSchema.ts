import { z } from 'zod'

export const hostSchema = z.object({
	identifier: z.string(),
})

export type hostSchemaType = z.infer<typeof hostSchema>

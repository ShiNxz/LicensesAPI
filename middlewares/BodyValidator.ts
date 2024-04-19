import { zValidator } from '@hono/zod-validator'
import { ZodObject, z } from 'zod'

const BodyValidator = (schema: ZodObject<any>) => zValidator('json', schema)

export default BodyValidator

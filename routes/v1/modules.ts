import { Hono } from 'hono'
import { moduleSchema, moduleSchemaPartial, type moduleSchemaType } from '~/schemas/ModuleSchema'
import BodyValidator from '~/middlewares/BodyValidator'
import TokenMiddleware from '~/middlewares/Token'
import Module from '~/models/Module'

const modules = new Hono()

/**
 * @public
 * Get all modules from the database
 */
modules.get('/', async (c) => {
	const allModules = await Module.find()

	return c.json(allModules)
})

/**
 * @public
 * Get modules by a category
 */
modules.get('/:category', async (c) => {
	try {
		const category = c.req.param('category')

		// Find modules that includes the category in their categories array
		const modules = await Module.find({
			categories: { $in: [category] },
		})

		if (!modules) return c.json({ error: 'Modules not found' }, 404)

		return c.json(modules)
	} catch (error) {
		return c.json({ error: 'Modules not found' }, 404)
	}
})

/**
 * Register a new module to the database
 */
modules.post('/', TokenMiddleware(), BodyValidator(moduleSchema), async (c) => {
	const { identifier, ...props } = await c.req.json<moduleSchemaType>()

	// Check if there is already a module with this identifier
	const isExist = await Module.findOne({ identifier })
	if (isExist) return c.json({ error: 'Module already exists (identifier)' }, 400)

	// Check if the host is already registered, if not, create a new one
	const newModule = await Module.create({ identifier: identifier.toLowerCase(), ...props })

	return c.json(newModule)
})

/**
 * Update a module by its identifier
 */
modules.put('/:identifier', TokenMiddleware(), BodyValidator(moduleSchemaPartial), async (c) => {
	const identifier = c.req.param('identifier')

	// Destructure the identifier from the request body, users are not allowed to update the identifier
	const { identifier: _, ...props } = await c.req.json<moduleSchemaType>()

	const updatedModule = await Module.findOneAndUpdate({ identifier }, { ...props }, { new: true })

	if (!updatedModule) return c.json({ error: 'Module not found' }, 404)

	return c.json(updatedModule)
})

/**
 * Delete a module by its identifier
 */
modules.delete('/:identifier', TokenMiddleware(), async (c) => {
	const identifier = c.req.param('identifier')

	// todo check if there are active licenses for this module

	const deletedModule = await Module.findOneAndDelete({ identifier })

	if (!deletedModule) return c.json({ error: 'Module not found' }, 404)

	return c.json(deletedModule)
})

export default modules

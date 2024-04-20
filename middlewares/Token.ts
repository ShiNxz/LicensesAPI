import { bearerAuth } from 'hono/bearer-auth'

const TokenMiddleware = () => bearerAuth({ token: Bun.env.TOKEN! })

export default TokenMiddleware

import { connect, type ConnectOptions } from 'mongoose'

const { MONGODB_URI, MONGODB_DB } = Bun.env

if (!MONGODB_URI) throw new Error('MONGODB_URI not defined')
if (!MONGODB_DB) throw new Error('MONGODB_DB not defined')

const options: ConnectOptions = {
	dbName: MONGODB_DB,
}

const MongoDB = async () => {
	try {
		const conn = await connect(MONGODB_URI, options)

		console.log(`[MongoDB] Connected: ${conn.connection.host}`)
	} catch (err) {
		console.error(`[DB] Error connecting to database: ${err}`)
		process.exit(1)
	}
}

export default MongoDB

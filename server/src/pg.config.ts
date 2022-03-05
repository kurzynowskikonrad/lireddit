import dotenv from 'dotenv'

dotenv.config()

export default {
	user: 'kondo',
	password: process.env.PASSWORD as string,
	database: 'lireddit',
	port: process.env.PORT as unknown as number, // pretty sure this isn't the best way to do this...
}

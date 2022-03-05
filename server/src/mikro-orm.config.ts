import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import { Post } from './entities/Post'
import path from 'path'
import { User } from './entities/User'
import dotenv from 'dotenv'

dotenv.config()

export default {
	migrations: {
		path: path.join(__dirname, './migrations'), // path to the folder with migrations
		glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
	},
	entities: [Post, User],
	dbName: 'lireddit',
	password: process.env.PASSWORD as string,
	port: process.env.PORT as unknown as number,
	type: 'postgresql',
	debug: !__prod__,
	allowGlobalContext: true, // quick-fix to validation error
} as Parameters<typeof MikroORM.init>[0]

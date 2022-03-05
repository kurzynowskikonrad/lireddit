import { MikroORM } from '@mikro-orm/core'
import { password, port, __prod__ } from './constants'
import { Post } from './entities/Post'
import path from 'path'
import { User } from './entities/User'

export default {
	migrations: {
		path: path.join(__dirname, './migrations'), // path to the folder with migrations
		glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
	},
	entities: [Post, User],
	dbName: 'lireddit',
	password: password,
	port: port,
	type: 'postgresql',
	debug: !__prod__,
	allowGlobalContext: true, // quick-fix to validation error
} as Parameters<typeof MikroORM.init>[0]

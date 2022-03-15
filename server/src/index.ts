import 'reflect-metadata'
import { __prod__ } from './constants'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import session from 'express-session'
import { MyContextType } from './types'
import pgConfig from './pg.config'
import connectPg from 'connect-pg-simple'
import pg from 'pg'
import cors from 'cors'
import dotenv from 'dotenv'
import { createConnection } from 'typeorm'
import { Post } from './entities/Post'
import { User } from './entities/User'
import path from 'path'
import { Updoot } from './entities/Updoot'
import { createUserLoader } from './utils/createUserLoader'
import { createUpdootLoader } from './utils/createUpdootLoader'

dotenv.config()

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		database: 'lireddit2',
		username: 'postgres',
		password: process.env.PASSWORD as string,
		port: process.env.PORT as unknown as number,
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User, Updoot],
	})
	await conn.runMigrations()

	//await Post.delete({})

	const app = express()

	const pgStore = connectPg(session)
	const pgPool = new pg.Pool(pgConfig)

	const corsOptions = {
		origin: 'http://localhost:3000',
		credentials: true, // <-- REQUIRED backend setting
	}

	app.use(cors(corsOptions))

	app.use(
		session({
			name: process.env.COOKIE_NAME,
			store: new pgStore({
				pool: pgPool,
				tableName: 'user_sessions',
				createTableIfMissing: true,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
				httpOnly: true,
				sameSite: 'lax',
				secure: __prod__, //cookie only works in https
			},
			saveUninitialized: false,
			secret: process.env.SECRET as string | string[],
			resave: false,
		})
	)

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
		context: ({ req, res }): MyContextType => ({
			req,
			res,
			userLoader: createUserLoader(),
			updootLoader: createUpdootLoader(),
		}),
	})

	await apolloServer.start()
	apolloServer.applyMiddleware({
		app,
		cors: false,
	})

	app.listen(4000, () => {
		console.log('server started on localhost:4000')
	})
}

main().catch((err) => console.log(err))

import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { COOKIE_NAME, secret, __prod__ } from './constants'
import microConfig from './mikro-orm.config'
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

const main = async () => {
	const orm = await MikroORM.init(microConfig)
	orm.getMigrator().up()

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
			name: COOKIE_NAME,
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
			secret: secret,
			resave: false,
		})
	)

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
		context: ({ req, res }): MyContextType => ({ em: orm.em, req, res }),
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

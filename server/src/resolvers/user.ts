import { User } from '../entities/User'
import { MyContextType } from 'src/types'
import {
	Resolver,
	Arg,
	Field,
	Ctx,
	Mutation,
	ObjectType,
	Query,
} from 'type-graphql'
import argon2 from 'argon2'
import { EntityManager } from '@mikro-orm/postgresql'
import { COOKIE_NAME } from '../constants'
import { UsernamePasswordInput } from './UsernamePasswordInput'
import { validateRegister } from '../utils/validateRegister'

@ObjectType()
class FieldError {
	@Field()
	field: string

	@Field()
	message: string
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[]

	@Field(() => User, { nullable: true })
	user?: User
}

@Resolver()
export class UserResolver {
	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { em }: MyContextType
	) {
		const user = await em.findOne(User, { email })
		return user
	}

	@Query(() => User, { nullable: true })
	async me(@Ctx() { req, em }: MyContextType) {
		console.log(req.session)
		// you are not logged in
		if (!req.session.userId) {
			return null
		}

		const user = await em.findOne(User, { id: req.session.userId })
		return user
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContextType
	): Promise<UserResponse> {
		const errors = validateRegister(options)
		if (errors) {
			return { errors }
		}

		const hashedPassword = await argon2.hash(options.password)
		let user
		try {
			const result = await (em as EntityManager)
				.createQueryBuilder(User)
				.getKnexQuery()
				.insert({
					username: options.username,
					email: options.email,
					password: hashedPassword,
					// knex needs to know db col names
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returning('*')
			user = result[0]
			await em.persistAndFlush(user)
		} catch (err) {
			if (err.code === '23505') {
				return {
					errors: [
						{
							field: 'username',
							message: 'username already taken',
						},
					],
				}
			}
		}

		//store sessionID
		req.session.userId = user.id

		return { user }
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { em, req }: MyContextType
	): Promise<UserResponse> {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail }
		)
		if (!user) {
			return {
				errors: [
					{
						field: 'username',
						message: "that username doesn't exist",
					},
				],
			}
		}
		const valid = await argon2.verify(user.password, password)
		if (!valid) {
			return {
				errors: [
					{
						field: 'password',
						message: 'incorrect password',
					},
				],
			}
		}

		req.session.userId = user.id

		return {
			user,
		}
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContextType) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(COOKIE_NAME)
				if (err) {
					console.log(err)
					resolve(false)
					return
				}
				resolve(true)
			})
		)
	}
}
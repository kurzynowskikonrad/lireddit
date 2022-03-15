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
	FieldResolver,
	Root,
} from 'type-graphql'
import argon2 from 'argon2'
import { UsernamePasswordInput } from './UsernamePasswordInput'
import { validateRegister } from '../utils/validateRegister'
import { Token } from 'graphql'
import { getConnection } from 'typeorm'
// import { v4 } from 'uuid'

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

@Resolver(User)
export class UserResolver {
	@FieldResolver(() => String)
	email(@Root() user: User, @Ctx() { req }: MyContextType) {
		if (req.session.userId === user.id) {
			return user.email
		}
		return ''
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { req }: MyContextType
	): Promise<UserResponse> {
		if (newPassword.length <= 2) {
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'length must be greater than 2',
					},
				],
			}
		}
		// const key = FORGET_PASSWORD_PREFIX + token
		// const userId = await redis.get(FORGET_PASSWORD_PREFIX + token)
		// if (!userId) {
		// 	return {
		// 		errors: [
		// 			{
		// 				field: 'token',
		// 				message: 'token expired',
		// 			},
		// 		],
		// 	}
		// }

		// const userIdNum = parseInt(userId)
		// const user = await User.findOne(userIdNum)

		// if (!user) {
		// 	return {
		// 		errors: [
		// 			{
		// 				field: 'token',
		// 				message: 'user no longer exists',
		// 			},
		// 		],
		// 	}
		// }

		// User.update({id: userIdNum}, {password: await argon2.hash(newPassword)})
		// await redis.del(key) // key = PASSWORD_PREFIX + token

		// // log in user after change password
		// req.session.userId = user.id
		// return { user }
		return {}
	}

	@Mutation(() => Boolean)
	async forgotPassword(@Arg('email') email: string, @Ctx() {}: MyContextType) {
		const user = await User.findOne({ where: email })
		// token = v4()

		if (!user) {
			// the email is not in the db
			return true
		}

		// await redis.set(
		// FORGET_PASSWORD_PREFIX + Token,
		// 	user.id,
		// 	"ex",
		// 	1000*60*60*24*3
		// ) 3 days

		// await sendEmail(
		// 	email,
		// 	`<a href="http://localhost:3000/change-password/${token}">reset password</a>`
		// )

		return true
	}

	@Query(() => User, { nullable: true })
	me(@Ctx() { req }: MyContextType) {
		// you are not logged in
		if (!req.session.userId) {
			return null
		}

		return User.findOne(req.session.userId)
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { req }: MyContextType
	): Promise<UserResponse> {
		const errors = validateRegister(options)
		if (errors) {
			return { errors }
		}

		const hashedPassword = await argon2.hash(options.password)
		let user
		try {
			// User.create({
			// 	username: options.username,
			// 	email: options.email,
			// 	password: hashedPassword,
			// }).save()
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					email: options.email,
					password: hashedPassword,
				})
				.returning('*')
				.execute()
			user = result.raw[0]
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
		@Ctx() { req }: MyContextType
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		)
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
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
				res.clearCookie(process.env.COOKIE_NAME as string)
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

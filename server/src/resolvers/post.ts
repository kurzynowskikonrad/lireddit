import { Post } from '../entities/Post'
import { MyContextType } from 'src/types'
import { Resolver, Query, Ctx, Arg, Mutation } from 'type-graphql'

@Resolver()
export class PostResolver {
	@Query(() => [Post])
	async posts(@Ctx() { em }: MyContextType): Promise<Post[]> {
		return em.find(Post, {})
	}

	@Query(() => Post, { nullable: true })
	post(
		@Arg('id') id: number,
		@Ctx() { em }: MyContextType
	): Promise<Post | null> {
		return em.findOne(Post, { id })
	}

	@Mutation(() => Post)
	async createPost(
		@Arg('title') title: string,
		@Ctx() { em }: MyContextType
	): Promise<Post> {
		const post = em.create(Post, { title })
		await em.persistAndFlush(post)
		return post
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true }) title: string,
		@Ctx() { em }: MyContextType
	): Promise<Post | null> {
		const post = await em.findOne(Post, { id })
		if (!post) {
			return null
		}
		if (typeof title !== 'undefined') {
			post.title = title
			await em.persistAndFlush(post)
		}
		return post
	}

	@Mutation(() => Boolean)
	async deletePost(
		@Arg('id') id: number,
		@Ctx() { em }: MyContextType
	): Promise<boolean> {
		await em.nativeDelete(Post, { id })
		return true
	}
}
import { Cache, cacheExchange, Resolver } from '@urql/exchange-graphcache'
import Router from 'next/router'
import {
	dedupExchange,
	Exchange,
	fetchExchange,
	stringifyVariables,
} from 'urql'
import { pipe, tap } from 'wonka'
import {
	DeletePostMutationVariables,
	LoginMutation,
	LogoutMutation,
	MeDocument,
	MeQuery,
	RegisterMutation,
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'
import { gql } from '@urql/core'
import { isServer } from './isServer'

const errorExchange: Exchange =
	({ forward }) =>
	(op$) => {
		return pipe(
			forward(op$),
			tap(({ error }) => {
				if (error) {
					if (error.message.includes('not authenticated')) {
						Router.replace('/login')
					}
				}
			})
		)
	}

function invalidateAllPosts(cache: Cache) {
	const allFields = cache.inspectFields('Query')
	const fieldInfos = allFields.filter((info) => info.fieldName === 'posts')
	fieldInfos.forEach((fi) => {
		cache.invalidate('Query', 'posts', fi.arguments)
	})
}

export const cursorPagination = (): Resolver => {
	return (_parent, fieldArgs, cache, info) => {
		const { parentKey: entityKey, fieldName } = info
		const allFields = cache.inspectFields(entityKey)
		const fieldInfos = allFields.filter((info) => info.fieldName === fieldName)
		const size = fieldInfos.length
		if (size === 0) {
			return undefined
		}

		const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
		const isItInTheCache = cache.resolve(
			cache.resolve(entityKey, fieldKey) as string,
			'posts'
		)
		info.partial = !isItInTheCache
		let hasMore = true
		let results: string[] = []
		fieldInfos.forEach((fi) => {
			const key = cache.resolve(entityKey, fi.fieldKey) as string
			const data = cache.resolve(key, 'posts') as string[]
			const _hasMore = cache.resolve(key, 'hasMore')
			if (!_hasMore) {
				hasMore = _hasMore as boolean
			}
			results.push(...data)
		})

		return { __typename: 'PaginatedPosts', hasMore, posts: results }
	}
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
	let cookie = ''
	if (isServer()) {
		cookie = ctx?.req?.headers?.cookie
	}
	return {
		url: 'http://localhost:4000/graphql',
		fetchOptions: {
			credentials: 'include' as const,
			headers: cookie
				? {
						cookie,
				  }
				: undefined,
		},
		exchanges: [
			dedupExchange,
			cacheExchange({
				keys: {
					PaginatedPosts: () => null,
				},
				resolvers: {
					Query: {
						posts: cursorPagination(),
					},
				},
				updates: {
					Mutation: {
						// (result, args, cache, info)
						deletePost: (_result, args, cache, _) => {
							cache.invalidate({
								__typename: 'Post',
								id: (args as DeletePostMutationVariables).id,
							})
						},
						vote: (_result, args, cache, _) => {
							const { postId, value } = args
							const data = cache.readFragment(
								gql`
									fragment _ on Post {
										id
										points
										voteStatus
									}
								`,
								{ id: postId }
							)
							if (data) {
								if (data.voteStatus === value) {
									return
								}
								const newPoints =
									data.points + (!data.voteStatus ? 1 : 2) * (value as number)
								cache.writeFragment(
									gql`
										fragment _ on Post {
											points
											voteStatus
										}
									`,
									{ id: postId, points: newPoints, voteStatus: value }
								)
							}
						},
						createPost: (_result, _, cache, __) => {
							invalidateAllPosts(cache)
						},
						logout: (_result, _, cache, __) => {
							betterUpdateQuery<LogoutMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								() => ({ me: null })
							)
						},
						login: (_result, _, cache, __) => {
							betterUpdateQuery<LoginMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								(result, query) => {
									if (result.login.errors) {
										return query
									} else {
										return {
											me: result.login.user,
										}
									}
								}
							)
							invalidateAllPosts(cache)
						},
						register: (_result, _, cache, __) => {
							betterUpdateQuery<RegisterMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								(result, query) => {
									if (result.register.errors) {
										return query
									} else {
										return {
											me: result.register.user,
										}
									}
								}
							)
						},
					},
				},
			}),
			errorExchange,
			ssrExchange,
			fetchExchange,
		],
	}
}

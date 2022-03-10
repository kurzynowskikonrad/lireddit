import { cacheExchange, Resolver } from '@urql/exchange-graphcache'
import Router from 'next/router'
import {
	dedupExchange,
	Exchange,
	fetchExchange,
	stringifyVariables,
} from 'urql'
import { pipe, tap } from 'wonka'
import {
	LoginMutation,
	LogoutMutation,
	MeDocument,
	MeQuery,
	RegisterMutation,
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'
import { gql } from '@urql/core'

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

	// 	const visited = new Set()
	// 	let result: NullArray<string> = []
	// 	let prevOffset: number | null = null

	// 	for (let i = 0; i < size; i++) {
	// 		const { fieldKey, arguments: args } = fieldInfos[i]
	// 		if (args === null || !compareArgs(fieldArgs, args)) {
	// 			continue
	// 		}

	// 		const links = cache.resolve(entityKey, fieldKey) as string[]
	// 		const currentOffset = args[offsetArgument]

	// 		if (
	// 			links === null ||
	// 			links.length === 0 ||
	// 			typeof currentOffset !== 'number'
	// 		) {
	// 			continue
	// 		}

	// 		const tempResult: NullArray<string> = []

	// 		for (let j = 0; j < links.length; j++) {
	// 			const link = links[j]
	// 			if (visited.has(link)) continue
	// 			tempResult.push(link)
	// 			visited.add(link)
	// 		}

	// 		if (
	// 			(!prevOffset || currentOffset > prevOffset) ===
	// 			(mergeMode === 'after')
	// 		) {
	// 			result = [...result, ...tempResult]
	// 		} else {
	// 			result = [...tempResult, ...result]
	// 		}

	// 		prevOffset = currentOffset
	// 	}

	// 	const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs)
	// 	if (hasCurrentPage) {
	// 		return result
	// 	} else if (!(info as any).store.schema) {
	// 		return undefined
	// 	} else {
	// 		info.partial = true
	// 		return result
	// 	}
	// }
}

export const createUrqlClient = (ssrExchange: any) => ({
	// ...add your Client options here
	url: 'http://localhost:4000/graphql',
	fetchOptions: {
		credentials: 'include' as const,
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
					vote: (_result, args, cache, info) => {
						const { postId, value } = args
						const data = cache.readFragment(
							gql`
								fragment _ on Post {
									id
									points
								}
							`,
							{ id: postId }
						)
						console.log('data: ', data)
						if (data) {
							const newPoints = data.points + value
							cache.writeFragment(
								gql`
									fragment _ on Post {
										points
									}
								`,
								{ id: postId, points: newPoints } as any
							)
						}
					},
					createPost: (_result, args, cache, info) => {
						// console.log('start')
						// console.log(cache.inspectFields('Query'))
						const allFields = cache.inspectFields('Query')
						const fieldInfos = allFields.filter(
							(info) => info.fieldName === 'posts'
						)
						fieldInfos.forEach((fi) => {
							cache.invalidate('Query', 'posts', fi.arguments)
						})
						// cache.invalidate('Query', 'posts', {
						// 	limit: 33, // limit needs to match limit defined in web/src/pages/index.tsx
						// })
						// console.log(cache.inspectFields('Query'))
						// console.log('end')
					},
					logout: (_result, args, cache, info) => {
						betterUpdateQuery<LogoutMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							_result,
							() => ({ me: null })
						)
					},
					login: (_result, args, cache, info) => {
						// cache.updateQuery({ query: MeDocument }, (data: MeQuery) => { })
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
					},
					register: (_result, args, cache, info) => {
						// cache.updateQuery({ query: MeDocument }, (data: MeQuery) => { })
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
})

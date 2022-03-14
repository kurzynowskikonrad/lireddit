import { withUrqlClient } from 'next-urql'
import { Layout } from '../components/Layout'
import {
	useDeletePostMutation,
	useMeQuery,
	usePostsQuery,
} from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import NextLink from 'next/link'
import {
	Box,
	Button,
	Flex,
	Heading,
	IconButton,
	Link,
	Stack,
	Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { UpdootSection } from '../components/UpdootSection'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'

const Index = () => {
	const [variables, setVariables] = useState({
		limit: 33,
		cursor: null as null | string,
	})
	const [{ data: meData }] = useMeQuery()
	const [{ data, fetching }] = usePostsQuery({
		variables,
	})
	const [, deletePost] = useDeletePostMutation()

	if (!fetching && !data) {
		return <div>Error: query failed</div>
	}

	return (
		<Layout>
			{!data && fetching ? (
				<div>loading...</div>
			) : (
				<Stack spacing={8}>
					{data!.posts.posts.map((p) =>
						!p ? null : (
							<Flex key={p.id} p={5} shadow='md' borderWidth='1px'>
								<UpdootSection post={p} />
								<Box flex={1}>
									<NextLink href='/post/[id]' as={`/post/${p.id}`}>
										<Link>
											<Heading fontSize='xl'>{p.title}</Heading>
										</Link>
									</NextLink>
									<Text>posted by {p.creator.username}</Text>
									<Flex align='center'>
										<Text flex={1} mt={4}>
											{p.textSnippet}
										</Text>
										{meData?.me?.id === p.creator.id ? null : (
											<Box ml='auto'>
												<NextLink
													href='/post/edit/[id]'
													as={`/post/edit/${p.id}`}
												>
													<IconButton
														as={Link}
														mr={4}
														colorScheme='teal'
														icon={<EditIcon />}
														aria-label='edit post'
														onClick={() => {}}
													/>
												</NextLink>
												<IconButton
													colorScheme='red'
													icon={<DeleteIcon />}
													aria-label='delete post'
													onClick={() => {
														deletePost({ id: p.id })
													}}
												/>
											</Box>
										)}
									</Flex>
								</Box>
							</Flex>
						)
					)}
				</Stack>
			)}
			{data && data.posts.hasMore ? (
				<Flex>
					<Button
						onClick={() => {
							setVariables({
								limit: variables.limit,
								cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
							})
						}}
						isLoading={fetching}
						m='auto'
						my={8}
					>
						load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	)
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)

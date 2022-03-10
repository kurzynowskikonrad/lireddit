import React from 'react'
import { Flex, IconButton } from '@chakra-ui/react'
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql'

interface UpdootSectionProps {
	post: PostSnippetFragment
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
	const [, vote] = useVoteMutation()
	return (
		<Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
			<IconButton
				colorScheme='teal'
				variant={post.voteStatus === 1 ? undefined : 'ghost'}
				aria-label='upVote post'
				onClick={async () => {
					if (post.voteStatus === 1) {
						return
					}
					await vote({
						postId: post.id,
						value: 1,
					})
				}}
				icon={<ChevronUpIcon />}
			/>
			{post.points}
			<IconButton
				colorScheme='orange'
				variant={post.voteStatus === -1 ? undefined : 'ghost'}
				aria-label='downVote post'
				onClick={async () => {
					if (post.voteStatus === -1) {
						return
					}
					await vote({
						postId: post.id,
						value: -1,
					})
				}}
				icon={<ChevronDownIcon />}
			/>
		</Flex>
	)
}

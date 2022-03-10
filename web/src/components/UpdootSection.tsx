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
				aria-label='upVote post'
				onClick={async () => {
					await vote({
						postId: post.id,
						value: 1,
					})
				}}
				icon={<ChevronUpIcon />}
			/>
			{post.points}
			<IconButton
				colorScheme='teal'
				aria-label='downVote post'
				onClick={async () => {
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

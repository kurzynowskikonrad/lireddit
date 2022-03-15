import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { Box, IconButton, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useDeletePostMutation, useMeQuery } from '../generated/graphql'

interface EditDeletePostButtonsProps {
	id: number
	creatorId: number
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
	id,
	creatorId,
}) => {
	const [{ data: meData }] = useMeQuery()
	const [, deletePost] = useDeletePostMutation()

	if (meData?.me?.id !== creatorId) {
		return null
	}

	return (
		<Box>
			<NextLink href='/post/edit/[id]' as={`/post/edit/${id}`}>
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
					deletePost({ id })
				}}
			/>
		</Box>
	)
}

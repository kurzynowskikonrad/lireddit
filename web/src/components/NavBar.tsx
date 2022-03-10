import { Box, Button, Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { isServer } from '../utils/isServer'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
	const [{ data, fetching }] = useMeQuery({ pause: isServer() }) // remove pause for ssr 10:03:10
	let body = null

	// data is loading
	if (fetching) {
		// user not logged in
	} else if (!data?.me) {
		body = (
			<>
				<NextLink href='/login'>
					<Link mr={2}>login</Link>
				</NextLink>
				<NextLink href='/register'>
					<Link>register</Link>
				</NextLink>
			</>
		)
		// user logged in
	} else {
		body = (
			<Box>
				<Box mr={2}>{data.me.username}</Box>
				<Button
					onClick={() => {
						logout()
					}}
					isLoading={logoutFetching}
					variant='link'
				>
					logout
				</Button>
			</Box>
		)
	}
	return (
		<Flex zIndex={1} position='sticky' top={0} bg='tomato' p={4}>
			<Box ml={'auto'}>{body}</Box>
		</Flex>
	)
}

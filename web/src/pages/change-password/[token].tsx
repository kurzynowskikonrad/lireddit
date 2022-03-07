import { Box, Button, Flex, Link } from '@chakra-ui/react'
import { Formik, Form } from 'formik'
import { NextPage } from 'next'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { toErrorMap } from '../../utils/toErrorMap'
import NextLink from 'next/link'
import { useChangePasswordMutation } from '../../generated/graphql'

const ChangePassword: NextPage<{ token: string }> = () => {
	const router = useRouter()
	const [, changePassword] = useChangePasswordMutation()
	const [tokenError, setTokenError] = useState('')

	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ newPassword: '' }}
				onSubmit={async (values, { setErrors }) => {
					// need to implement storing tokens in postgres instead of redis
					// const response = await changePassword({
					// 	newPassword: values.newPassword,
					// 	token: typeof router.query.token === 'string' ? router.query.token : ""
					// })
					// if (response.data?.login.errors) {
					// 	const errorMap = toErrorMap(response.data.changePassword.errors)
					// 	if ('token' in errorMap) {
					// 		setTokenError(errorMap.token)
					// 	}
					// 	setErrors(toErrorMap(response.data.login.errors))
					// } else if (response.data?.login.user) {
					// 	router.push('/')
					// }
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='newPassword'
							placeholder='new password'
							label='New Password'
							type='password'
						/>
						{tokenError ? (
							<Flex>
								<Box mr={2} color='red'>
									{tokenError}
								</Box>
								<NextLink href='/forgot-password'>
									<Link>go forget it again</Link>
								</NextLink>
							</Flex>
						) : null}
						<Button
							mt={4}
							isLoading={isSubmitting}
							type='submit'
							colorScheme='teal'
						>
							Submit
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	)
}

export default withUrqlClient(createUrqlClient)(ChangePassword)

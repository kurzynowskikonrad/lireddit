import React from 'react'
import { Form, Formik } from 'formik'
import { Box, Button } from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper'
import { InputField } from '../components/InputField'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { useLoginMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'
import { useRouter } from 'next/router'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'

interface registerProps {}

const Login: React.FC<registerProps> = ({}) => {
	const router = useRouter()
	const [, login] = useLoginMutation()
	return (
		<>
			<Wrapper variant='small'>
				<Formik
					initialValues={{ usernameOrEmail: '', password: '' }}
					onSubmit={async (values, { setErrors }) => {
						const response = await login(values)
						if (response.data?.login.errors) {
							setErrors(toErrorMap(response.data.login.errors))
						} else if (response.data?.login.user) {
							router.push('/')
						}
						//console.log('response: ', response.data.register?.user?.id)
					}}
				>
					{({ isSubmitting }) => (
						<Form>
							<InputField
								name='usernameOrEmail'
								placeholder='username or email'
								label='Username or Email'
							/>
							<Box mt={4}>
								<InputField
									name='password'
									placeholder='password'
									label='Password'
									type='password'
								/>
							</Box>
							<Button
								mt={4}
								isLoading={isSubmitting}
								type='submit'
								colorScheme='teal'
							>
								login
							</Button>
						</Form>
					)}
				</Formik>
			</Wrapper>
			<DarkModeSwitch />
		</>
	)
}

export default withUrqlClient(createUrqlClient)(Login)

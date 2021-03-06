import React from 'react'
import { Form, Formik } from 'formik'
import { Box, Button } from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper'
import { InputField } from '../components/InputField'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { useRegisterMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'
import { useRouter } from 'next/router'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
	const router = useRouter()
	const [, register] = useRegisterMutation()
	return (
		<>
			<Wrapper variant='small'>
				<Formik
					initialValues={{ email: '', username: '', password: '' }}
					onSubmit={async (values, { setErrors }) => {
						const response = await register({ options: values })
						if (response.data?.register.errors) {
							setErrors(toErrorMap(response.data.register.errors))
						} else if (response.data?.register.user) {
							router.push('/')
						}
						//console.log('response: ', response.data.register?.user?.id)
					}}
				>
					{({ isSubmitting }) => (
						<Form>
							<InputField
								textarea={false}
								name='username'
								placeholder='username'
								label='Username'
							/>
							<Box mt={4}>
								<InputField
									textarea={false}
									name='email'
									placeholder='email'
									label='Email'
								/>
							</Box>
							<Box mt={4}>
								<InputField
									textarea={false}
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
								register
							</Button>
						</Form>
					)}
				</Formik>
			</Wrapper>
			<DarkModeSwitch />
		</>
	)
}

export default withUrqlClient(createUrqlClient)(Register)

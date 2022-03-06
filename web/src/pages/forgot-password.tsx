import { Box, Button } from '@chakra-ui/react'
import { Formik, Form } from 'formik'
import React, { useState } from 'react'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { createUrqlClient } from '../utils/createUrqlClient'
import { withUrqlClient } from 'next-urql'
import { useForgotPasswordMutation } from '../generated/graphql'

const ForgotPassword: React.FC<{}> = ({}) => {
	const [complete, setComplete] = useState(false)
	const [, forgotPassword] = useForgotPasswordMutation()

	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ email: '' }}
				onSubmit={async (values) => {
					await forgotPassword(values)
					setComplete(true)
				}}
			>
				{({ isSubmitting }) =>
					complete ? (
						<Box>
							if an account with that email exists, we sent you an email
						</Box>
					) : (
						<Form>
							<InputField
								name='email'
								placeholder='email'
								label='Email'
								type='email'
							/>
							<Button
								mt={4}
								isLoading={isSubmitting}
								type='submit'
								colorScheme='teal'
							>
								forgot password
							</Button>
						</Form>
					)
				}
			</Formik>
		</Wrapper>
	)
}

export default withUrqlClient(createUrqlClient)(ForgotPassword)

import { Box, Button } from '@chakra-ui/react'
import { Formik, Form } from 'formik'
import { InputField } from '../components/InputField'
import { useCreatePostMutation } from '../generated/graphql'
import { useRouter } from 'next/router'
import { createUrqlClient } from '../utils/createUrqlClient'
import { withUrqlClient } from 'next-urql'
import { Layout } from '../components/Layout'
import { useIsAuth } from '../utils/useIsAuth'

const CreatePost: React.FC<{}> = ({}) => {
	const router = useRouter()
	useIsAuth()
	const [, createPost] = useCreatePostMutation()
	return (
		<>
			<Layout variant='small'>
				<Formik
					initialValues={{ title: '', text: '' }}
					onSubmit={async (values) => {
						const { error } = await createPost({ input: values })
						console.log('error: ', error)
						if (!error) {
							router.push('/')
						}
					}}
				>
					{({ isSubmitting }) => (
						<Form>
							<InputField
								name='title'
								textarea={false}
								placeholder='title or email'
								label='Title'
							/>
							<Box mt={4}>
								<InputField
									textarea
									name='text'
									placeholder='text...'
									label='Body'
								/>
							</Box>
							<Button
								mt={4}
								isLoading={isSubmitting}
								type='submit'
								colorScheme='teal'
							>
								Create Post
							</Button>
						</Form>
					)}
				</Formik>
			</Layout>
		</>
	)
}

export default withUrqlClient(createUrqlClient)(CreatePost)

import React, { InputHTMLAttributes } from 'react'
import { useField } from 'formik'
import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Textarea,
} from '@chakra-ui/react'

type InputFieldProps = InputHTMLAttributes<HTMLElement> & {
	label: string
	name: string
	textarea: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
	label,
	textarea,
	size: _,
	...props
}) => {
	const [field, { error }] = useField(props)

	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{label}</FormLabel>
			{textarea ? (
				<Textarea {...field} {...props} id={field.name} />
			) : (
				<Input {...field} {...props} id={field.name} />
			)}
			{error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
		</FormControl>
	)
}

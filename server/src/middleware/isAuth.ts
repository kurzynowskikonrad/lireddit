import { MyContextType } from 'src/types'
import { MiddlewareFn } from 'type-graphql'

export const isAuth: MiddlewareFn<MyContextType> = ({ context }, next) => {
	if (!context.req.session.userId) {
		throw new Error('not authenitcated')
	}

	return next()
}

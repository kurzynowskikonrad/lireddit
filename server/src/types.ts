import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'
import { createUpdootLoader } from './utils/createUpdootLoader'
import { createUserLoader } from './utils/createUserLoader'

export type MyContextType = {
	req: Request & { session: Session & Partial<SessionData> }
	res: Response
	userLoader: ReturnType<typeof createUserLoader>
	updootLoader: ReturnType<typeof createUpdootLoader>
}

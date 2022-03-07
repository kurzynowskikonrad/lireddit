import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'

export type MyContextType = {
	req: Request & { session: Session & Partial<SessionData> }
	res: Response
}

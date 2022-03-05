import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core'
import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'

export type MyContextType = {
	em: EntityManager<IDatabaseDriver<Connection>>
	req: Request & { session: Session & Partial<SessionData> }
	res: Response
}

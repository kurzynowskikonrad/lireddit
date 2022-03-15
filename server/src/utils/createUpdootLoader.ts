import DataLoader from 'dataloader'
import { Updoot } from '../entities/Updoot'

// [1, 78, 9, 7]
// [{id: 1, username: 'ben'}, {}, {}, {}]
export const createUpdootLoader = () =>
	new DataLoader<{ postId: number; userId: number }, Updoot | null>(
		async (keys) => {
			const updoots = await Updoot.findByIds(keys as any)
			const updootIdsToUpdoot: Record<string, Updoot> = {}
			updoots.forEach((updoot) => {
				updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot
			})

			return keys.map((key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`])
		}
	)

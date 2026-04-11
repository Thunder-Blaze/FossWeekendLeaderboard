import { fetchGroupsStats } from '$lib/server/groups';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const { stats, timestamp } = await fetchGroupsStats();
	return {
		stats,
		timestamp
	};
};

export const actions: Actions = {
	refresh: async () => {
		const { stats, timestamp } = await fetchGroupsStats(true);
		return {
			success: true,
			stats,
			timestamp
		};
	}
};

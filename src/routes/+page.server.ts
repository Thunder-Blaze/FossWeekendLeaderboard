import type { PageServerLoad } from './$types';
import { fetchLeaderboard } from '$lib/server/github';
import { CACHE_DURATION_SECONDS } from '$lib/constants';

// We can cache in memory for the server response locally to avoid repeated GitHub fetches on every refresh
let cachedData: Awaited<ReturnType<typeof fetchLeaderboard>> | null = null;
let lastFetchTime = 0;

export const load: PageServerLoad = async ({ setHeaders, url }) => {
	const now = Date.now();
	const forceRefresh = url.searchParams.has('refresh');

	if (
		forceRefresh ||
		!cachedData ||
		now - lastFetchTime > CACHE_DURATION_SECONDS * 1000 ||
		cachedData.error
	) {
		cachedData = await fetchLeaderboard();
		lastFetchTime = now;
	}

	// Set browser/CDN cache headers
	setHeaders({
		'Cache-Control': `public, max-age=${CACHE_DURATION_SECONDS}`
	});

	return {
		leaderboard: cachedData.leaderboard,
		stats: cachedData.stats,
		error: cachedData.error
	};
};

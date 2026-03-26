export const ACCEPTED_LABEL_PREFIXES = ['accepted-', 'issue-created-'];
export const CACHE_DURATION_SECONDS = 900; // 15 minutes
export const GITHUB_API_URL = 'https://api.github.com/repos';
export const ISSUES_PER_PAGE = 100;
export const MAX_PAGES_TO_FETCH = 3;

// Author associations to exclude from the leaderboard scoring
export const IGNORED_AUTHOR_ASSOCIATIONS = ['OWNER', 'COLLABORATOR'];

export const HOMEPAGE_URL =
	'https://github.com/iiitl/FOSS-Weekend-2025?tab=readme-ov-file#welcome-to-foss-weekend-2025';
export const REFRESH_INTERVAL_MS = 60000; // Client auto-refresh interval (1 min)

export const EXTERNAL_CACHE_DURATION_SECONDS = 3600; // 1 hour

// Event time range in IST (UTC+5:30)
// Example: '2025-01-24T18:00:00+05:30'
export const START_TIME_IST = '2025-01-24T18:00:00+05:30';
export const END_TIME_IST = '2026-05-27T08:00:00+05:30';
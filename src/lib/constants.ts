export const ACCEPTED_LABEL_PREFIXES = ['accepted-', 'issue-created-'];
export const CACHE_DURATION_SECONDS = 900; // 15 minutes
export const GITHUB_API_URL = 'https://api.github.com/repos';
export const ISSUES_PER_PAGE = 100;
export const MAX_PAGES_TO_FETCH = 3;

// Author associations to exclude from the leaderboard scoring
export const IGNORED_AUTHOR_ASSOCIATIONS = ['OWNER', 'COLLABORATOR'];

export const HOMEPAGE_URL = 'https://github.com/iiitl/FOSS-Weekend-2026';
export const REFRESH_INTERVAL_MS = 60000; // Client auto-refresh interval (1 min)

export const EXTERNAL_CACHE_DURATION_SECONDS = 3600; // 1 hour

// Event time range in IST (UTC+5:30)
// Example: '2025-01-24T18:00:00+05:30'
export const START_TIME_IST = '2025-04-10T00:00:00+05:30';
export const END_TIME_IST = '2025-04-13T00:00:00+05:30';

export const TAG_COLORS = {
	SPECIAL: 'bg-amber-200',
	EXTERNAL: 'bg-sky-200',
	AI: 'bg-fuchsia-200',
	PR: 'bg-violet-200',
	ISSUE: 'bg-cyan-200',
	PTS: 'bg-accent'
} as const;

export const REPOS_FILE_PATH = 'repos.txt';
export const ACCEPTED_LABEL_PREFIXES = ['accepted-', 'issue-created'];
export const CACHE_DURATION_SECONDS = 900; // 15 minutes
export const GITHUB_API_URL = 'https://api.github.com/repos';
export const ISSUES_PER_PAGE = 100;
export const MAX_PAGES_TO_FETCH = 3;

// Author associations to exclude from the leaderboard scoring
export const IGNORED_AUTHOR_ASSOCIATIONS = ['OWNER', 'COLLABORATOR'];

export const HOMEPAGE_URL =
	'https://github.com/iiitl/FOSS-Weekend-2025?tab=readme-ov-file#welcome-to-foss-weekend-2025';
export const REFRESH_INTERVAL_MS = 60000; // Client auto-refresh interval (1 min)
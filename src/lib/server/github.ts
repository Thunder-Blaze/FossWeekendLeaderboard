import { env } from '$env/dynamic/private';
import { REPOS, type RepoConfig } from '$lib/repos';
import {
	ACCEPTED_LABEL_PREFIXES,
	GITHUB_API_URL,
	ISSUES_PER_PAGE,
	MAX_PAGES_TO_FETCH,
	IGNORED_AUTHOR_ASSOCIATIONS,
	SPECIAL_LABEL_PREFIX,
	START_TIME_IST,
	END_TIME_IST
} from '$lib/constants';

export interface ContributionEntry {
	title: string;
	url: string;
	points: number;
	repo_name: string;
	issue_number: number;
	type: 'PR' | 'Issue';
	isAI?: boolean;
	// isExternal?: boolean;
	specialTag?: string;
	specialPoints?: number;
	// repoStars?: number;
}

export interface LeaderboardEntry {
	username: string;
	avatarUrl: string;
	score: number;
	contributions: ContributionEntry[];
	// hasSpecialBonus?: boolean;
}

// In-memory cache for external contributions
// const externalCache = new Map<string, { data: ContributionEntry | null; timestamp: number }>();

function isWithinTimeRange(dateStr: string): boolean {
	const date = new Date(dateStr);
	const start = new Date(START_TIME_IST);
	const end = new Date(END_TIME_IST);
	return date >= start && date <= end;
}

function parseRepoString(input: string | RepoConfig): string {
	const name = typeof input === 'string' ? input : input.name;
	const trimmed = name.trim();
	if (trimmed.startsWith('https://github.com/')) {
		const parts = trimmed.replace('https://github.com/', '').split('/');
		if (parts.length >= 2) {
			return `${parts[0]}/${parts[1]}`;
		}
	} else if (trimmed.startsWith('http')) {
		try {
			const url = new URL(trimmed);
			const parts = url.pathname.split('/').filter(Boolean);
			if (parts.length >= 2) {
				return `${parts[0]}/${parts[1]}`;
			}
		} catch (e) { }
	}
	return trimmed;
}

export async function fetchReposList(): Promise<string[]> {
	return REPOS.map(parseRepoString);
}

/*
async function fetchExternalBestPR(
	username: string,
	internalRepos: string[],
	headers: Record<string, string>
): Promise<ContributionEntry | null> {
	const now = Date.now();
	const cached = externalCache.get(username);
	if (cached && now - cached.timestamp < EXTERNAL_CACHE_DURATION_SECONDS * 1000) {
		return cached.data;
	}

	try {
		const gqlQuery = `
        query($queryString: String!) {
          search(query: $queryString, type: ISSUE, first: 100) {
            nodes {
              ... on PullRequest {
                title
                url
                number
                repository {
                  nameWithOwner
                  stargazerCount
                }
              }
            }
          }
        }`;

		const queryString = `author:${username} is:pr is:merged created:${START_TIME_IST}..${END_TIME_IST}`;

		if (!env.GITHUB_TOKEN) {
			console.error(`[EXTERNAL] GITHUB_TOKEN missing for GraphQL search`);
			return null;
		}

		console.log(`[EXTERNAL] GraphQL search for ${username}`);

		const resp = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				...headers,
				Authorization: `Bearer ${env.GITHUB_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: gqlQuery,
				variables: { queryString }
			})
		});

		if (!resp.ok) {
			console.error(`[EXTERNAL] GraphQL error for ${username}: ${resp.status}`);
			return null;
		}

		const data = await resp.json();
		const items = data.data?.search?.nodes || [];

		console.log(`[EXTERNAL] Found ${items.length} PRs for ${username}`);

		let bestPR: ContributionEntry | null = null;
		let maxStars = -1;

		const internalRepoSet = new Set(internalRepos.map((r) => r.toLowerCase()));

		for (const item of items) {
			if (!item?.repository) continue;

			const repoFullName = item.repository.nameWithOwner;

			if (internalRepoSet.has(repoFullName.toLowerCase())) continue;

			const stars = item.repository.stargazerCount;

			if (stars >= 50 && stars > maxStars) {
				maxStars = stars;

				let points = 0;
				if (stars >= 1000) points = 100;
				else if (stars >= 250) points = 60;
				else if (stars >= 50) points = 40;

				bestPR = {
					title: item.title,
					url: item.url,
					points,
					repo_name: repoFullName,
					issue_number: item.number,
					type: 'PR',
					isExternal: true,
					repoStars: stars
				};
			}
		}

		externalCache.set(username, { data: bestPR, timestamp: now });
		return bestPR;
	} catch (e) {
		console.error(`[EXTERNAL] Error for ${username}:`, e);
		return null;
	}
}
*/

export async function fetchLeaderboard(): Promise<{
	leaderboard: LeaderboardEntry[];
	stats: {
		reposCount: number;
		itemsScanned: number;
		acceptedCount: number;
		timestamp: number;
	};
	error?: string;
}> {
	const repoConfigs = REPOS;
	const repoList = repoConfigs.map(parseRepoString);
	
	const stats = {
		reposCount: repoList.length,
		itemsScanned: 0,
		acceptedCount: 0,
		timestamp: Date.now()
	};

	if (repoList.length === 0) {
		return { leaderboard: [], stats, error: 'No repositories found' };
	}

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github.v3+json',
		'User-Agent': 'FOSS-Weekend-Leaderboard-App'
	};

	if (env.GITHUB_TOKEN) {
		headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	}

	const userMap = new Map<string, LeaderboardEntry>();
	const respPromises: Promise<Response>[] = [];

	for (const repo of repoList) {
		for (let i = 1; i <= MAX_PAGES_TO_FETCH; i++) {
			const url = `${GITHUB_API_URL}/${repo}/issues?state=all&per_page=${ISSUES_PER_PAGE}&page=${i}`;
			respPromises.push(fetch(url, { headers }));
		}
	}

	const responses = await Promise.all(respPromises);
	let errorOccurred: string | undefined;

	const allRepoData = await Promise.all(
		responses.map(async (response) => {
			if (!response.ok) {
				const status = response.status;
				let errorMessage = `GitHub API error: ${status}`;
				try {
					const errorData = await response.json();
					if (errorData.message) errorMessage = errorData.message;
				} catch (e) { }

				if (status === 403 || status === 429) {
					if (errorMessage.toLowerCase().includes('rate limit')) {
						errorOccurred = `GitHub API rate limit exceeded. Please try again later.`;
					} else {
						errorOccurred = errorMessage;
					}
				}
				return [];
			}
			return response.json();
		})
	);

	let allItems: any[] = [];
	for (const batch of allRepoData) {
		if (Array.isArray(batch)) {
			allItems = allItems.concat(batch);
			stats.itemsScanned += batch.length;
		}
	}

	const processedUrls = new Set<string>();

	for (const item of allItems) {
		if (!item.html_url || processedUrls.has(item.html_url)) continue;
		processedUrls.add(item.html_url);

		if (!isWithinTimeRange(item.created_at)) continue;

		const isPR = !!item.pull_request || item.html_url.includes('/pull/');
		const labels = item.labels || [];

		const acceptedLabel = labels.find(
			(l: any) =>
				l.name &&
				ACCEPTED_LABEL_PREFIXES.some((prefix) =>
					l.name.toLowerCase().includes(prefix.toLowerCase())
				)
		);

		if (acceptedLabel) {
			const isIgnoredAuthor =
				item.author_association && IGNORED_AUTHOR_ASSOCIATIONS.includes(item.author_association);
			if (!isPR && isIgnoredAuthor) continue;

			stats.acceptedCount++;
			const pointsMatch = acceptedLabel.name.toLowerCase().match(/\d+/);
			if (pointsMatch) {
				const points = parseInt(pointsMatch[0], 10);
				const login = item.user.login;

				if (!userMap.has(login)) {
					userMap.set(login, {
						username: login,
						avatarUrl: item.user.avatar_url,
						score: 0,
						contributions: []
					});
				}

				const userEntry = userMap.get(login)!;
				userEntry.score += points;

				let repoName = 'Unknown Repo';
				if (item.repository_url) {
					const repoParts = item.repository_url.split('/');
					repoName = `${repoParts[repoParts.length - 2]}/${repoParts[repoParts.length - 1]}`;
				} else {
					repoName = item.html_url.split('/').slice(-4, -2).join('/');
				}

				const isAI = labels.some((l: any) => l.name && l.name.toLowerCase().includes('ai'));
				const repoConfig = repoConfigs.find(
					(r) => parseRepoString(r).toLowerCase() === repoName.toLowerCase()
				);
				
				const finalRepoName = repoConfig ? repoConfig.name : repoName;
				const isSpecialRepo = repoConfig?.special || false;
				let specialPoints = 0;
				let specialTag = undefined;

				if (isSpecialRepo) {
					const specialLabel = labels.find((l: any) =>
						l.name && l.name.toLowerCase().startsWith(SPECIAL_LABEL_PREFIX.toLowerCase())
					);
					if (specialLabel) {
						specialTag = specialLabel.name;
						const match = specialTag.match(new RegExp(`${SPECIAL_LABEL_PREFIX}(\\d+)`, 'i'));
						if (match) {
							specialPoints = parseInt(match[1], 10);
						}
					}
				}

				userEntry.score += specialPoints;

				userEntry.contributions.push({
					title: item.title,
					url: item.html_url,
					points: points,
					repo_name: finalRepoName,
					issue_number: item.number,
					type: isPR ? 'PR' : 'Issue',
					isAI,
					specialTag,
					specialPoints
				});
			}
		}
	}

	/*
	const externalPromises = Array.from(userMap.keys()).map((username) =>
		fetchExternalBestPR(username, repoList, headers)
	);

	const externalResults = await Promise.all(externalPromises);

	let i = 0;
	for (const [username, userEntry] of userMap.entries()) {
		const externalPR = externalResults[i++];
		if (externalPR) {
			userEntry.score += externalPR.points;
			userEntry.contributions.push(externalPR);
			stats.acceptedCount++;
		}
	}
	*/

	const results = Array.from(userMap.values());
	results.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

	return {
		leaderboard: results,
		stats,
		error: errorOccurred
	};
}

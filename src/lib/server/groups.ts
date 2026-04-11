import groupsContent from '$lib/data/groups.toml?raw';
import { parse } from 'smol-toml';
import { env } from '$env/dynamic/private';
import { START_TIME_IST, END_TIME_IST, MAX_PAGES_TO_FETCH } from '$lib/constants';

export interface GroupStats {
	group: string;
	prCount: number;
	repos: string[];
}

interface GroupsConfig {
	[key: string]: {
		repos: string[];
	};
}

let cachedStats: GroupStats[] | null = null;
let lastFetchTime: number = 0;

export function getGroupsConfig(): GroupsConfig {
	return parse(groupsContent) as unknown as GroupsConfig;
}

export async function fetchGroupsStats(forceRefresh = false): Promise<{ stats: GroupStats[]; timestamp: number }> {
	if (!forceRefresh && cachedStats && Date.now() - lastFetchTime < 3600000) {
		// 1 hour cache by default if not forced
		return { stats: cachedStats, timestamp: lastFetchTime };
	}

	const config = getGroupsConfig();
	const groups = Object.keys(config);
	const repoToGroup = new Map<string, string>();

	for (const group of groups) {
		for (const repo of config[group].repos) {
			repoToGroup.set(repo.toLowerCase(), group);
		}
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'User-Agent': 'FOSS-Weekend-Leaderboard-App',
		Authorization: `Bearer ${env.GITHUB_TOKEN}`
	};

	const toUTC = (ist: string) => new Date(ist).toISOString().split('.')[0] + 'Z';
	const startUTC = toUTC(START_TIME_IST);
	const endUTC = toUTC(END_TIME_IST);

	// We'll search for all PRs in the org within the timeframe
	const prQueryString = `org:iiitl is:pr created:${startUTC}..${endUTC}`;
	
	const gqlQuery = `
        query($queryString: String!, $cursor: String) {
            search(query: $queryString, type: ISSUE, first: 100, after: $cursor) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                nodes {
                    ... on PullRequest {
                        repository {
                            name
                        }
                    }
                }
            }
        }
    `;

	const statsMap = new Map<string, number>();
	for (const group of groups) statsMap.set(group, 0);

	let totalScanned = 0;
	let totalAccepted = 0;

	try {
		let hasNextPage = true;
		let cursor: string | null = null;
		let pageCount = 0;

		while (hasNextPage && pageCount < (MAX_PAGES_TO_FETCH || 15)) {
			pageCount++;
			const response: Response = await fetch('https://api.github.com/graphql', {
				method: 'POST',
				headers,
				body: JSON.stringify({ query: gqlQuery, variables: { queryString: prQueryString, cursor } })
			});

			if (!response.ok) {
				throw new Error(`GitHub API HTTP error: ${response.status}`);
			}

			const result = (await response.json()) as {
				data: {
					search: {
						pageInfo: { hasNextPage: boolean; endCursor: string | null };
						nodes: { repository: { name: string } }[];
					};
				};
				errors?: { message: string }[];
			};

			if (result.errors) {
				throw new Error(`GraphQL Error: ${result.errors[0]?.message}`);
			}

			const nodes = result.data.search.nodes;
			totalScanned += nodes.length;

			for (const node of nodes) {
				if (node?.repository?.name) {
					const repoName = node.repository.name.toLowerCase();
					const group = repoToGroup.get(repoName);
					if (group) {
						statsMap.set(group, (statsMap.get(group) || 0) + 1);
						totalAccepted++;
					}
				}
			}

			hasNextPage = result.data.search.pageInfo.hasNextPage;
			cursor = result.data.search.pageInfo.endCursor;
		}

		cachedStats = groups.map((group) => ({
			group,
			prCount: statsMap.get(group) || 0,
			repos: config[group].repos
		}));
		lastFetchTime = Date.now();

		console.log(
			`[GROUPS] Processing completed successfully. Total accepted items: ${totalAccepted} out of ${totalScanned} items scanned.`
		);

		return { stats: cachedStats, timestamp: lastFetchTime };
	} catch (e) {
		console.error('[GROUPS] Failed to fetch stats:', e);
		throw e;
	}
}

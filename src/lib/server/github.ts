import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';
import {
	REPOS_FILE_PATH,
	ACCEPTED_LABEL_PREFIXES,
	GITHUB_API_URL,
	ISSUES_PER_PAGE,
	MAX_PAGES_TO_FETCH,
	IGNORED_AUTHOR_ASSOCIATIONS
} from '$lib/constants';

export interface ContributionEntry {
	title: string;
	url: string;
	points: number;
	repo_name: string;
	issue_number: number;
	type: 'PR' | 'Issue';
}

export interface LeaderboardEntry {
	username: string;
	avatarUrl: string;
	score: number;
	contributions: ContributionEntry[];
}

function parseRepoString(input: string): string {
	input = input.trim();
	if (input.startsWith('https://github.com/')) {
		const parts = input.replace('https://github.com/', '').split('/');
		if (parts.length >= 2) {
			return `${parts[0]}/${parts[1]}`;
		}
	} else if (input.startsWith('http')) {
		try {
			const url = new URL(input);
			const parts = url.pathname.split('/').filter(Boolean);
			if (parts.length >= 2) {
				return `${parts[0]}/${parts[1]}`;
			}
		} catch (e) { }
	}
	return input;
}

export async function fetchReposList(): Promise<string[]> {
	try {
		const rawPath = path.resolve(process.cwd(), REPOS_FILE_PATH);
		if (!fs.existsSync(rawPath)) {
			console.warn(`Repos file not found at ${rawPath}. Returning empty list.`);
			return [];
		}
		const text = fs.readFileSync(rawPath, 'utf-8');
		return text
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map(parseRepoString);
	} catch (error) {
		console.error('Error reading repos file:', error);
		return [];
	}
}

export async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[]; error?: string }> {
	const repoList = await fetchReposList();
	if (repoList.length === 0) return { leaderboard: [], error: 'No repositories found in repos.txt' };

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github.v3+json',
		'User-Agent': 'FOSS-Weekend-Leaderboard-App'
	};

	if (env.GITHUB_TOKEN) {
		headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	}

	const userMap = new Map<string, LeaderboardEntry>();
	const respPromises: Promise<Response>[] = [];

	// Use /issues endpoint as it returns both Issues and Pull Requests
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
					if (errorData.message) {
						errorMessage = errorData.message;
					}
				} catch (e) {
					// Fallback if JSON parsing fails
				}

				if (status === 403 || status === 429) {
					if (errorMessage.toLowerCase().includes('rate limit')) {
						errorOccurred = `GitHub API rate limit exceeded. Please try again later or provide a GITHUB_TOKEN.`;
					} else {
						errorOccurred = errorMessage;
					}
				} else {
					console.error(`Error fetching from GitHub: ${errorMessage}`);
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
		}
	}

	const processedUrls = new Set<string>();

	for (const item of allItems) {
		if (!item.html_url || processedUrls.has(item.html_url)) continue;
		processedUrls.add(item.html_url);

		const isPR = !!item.pull_request || item.html_url.includes('/pull/');
		const type = isPR ? 'PR' : 'Issue';

		if (!item.labels || !Array.isArray(item.labels)) continue;

		// Find any label that matches any of the accepted prefixes
		const acceptedLabel = (item.labels || []).find((l: any) => 
			l.name && ACCEPTED_LABEL_PREFIXES.some(prefix => l.name.toLowerCase().includes(prefix.toLowerCase()))
		);

		if (acceptedLabel) {
			// Rule: Issues are skipped if authored by OWNER/COLLABORATOR as per hackathon rules
			const isIgnoredAuthor = item.author_association && IGNORED_AUTHOR_ASSOCIATIONS.includes(item.author_association);
			
			if (!isPR && isIgnoredAuthor) {
				continue;
			}

			const labelName = acceptedLabel.name.toLowerCase();
			// Extract points: look for number after the prefix or anywhere in the label
			const pointsMatch = labelName.match(/\d+/);
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

				userEntry.contributions.push({
					title: item.title,
					url: item.html_url,
					points: points,
					repo_name: repoName,
					issue_number: item.number,
					type: type
				});
			}
		}
	}

	const results = Array.from(userMap.values());
	results.sort((a, b) => b.score - a.score);

	return {
		leaderboard: results,
		error: errorOccurred
	};
}

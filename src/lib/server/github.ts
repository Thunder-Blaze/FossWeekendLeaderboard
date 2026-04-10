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
    isAI: boolean;
    aiLabel?: string;
    createdAt: string;
    specialTag?: string;
    specialPoints?: number;
}

interface GQLNode {
    __typename: 'PullRequest' | 'Issue';
    title: string;
    url: string;
    number: number;
    createdAt: string;
    author: {
        login: string;
        avatarUrl: string;
    } | null;
    repository: {
        nameWithOwner: string;
    } | null;
    labels: {
        nodes: {
            name: string;
        }[];
    } | null;
    authorAssociation: string | null;
}

interface GQLSearchResponse {
    data: {
        search: {
            issueCount: number;
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
            };
            nodes: (GQLNode | null)[];
        };
    };
    errors?: { message: string }[];
}

export interface LeaderboardEntry {
    username: string;
    avatarUrl: string;
    score: number;
    lastContributionTime: number;
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
    const repoConfigs = REPOS || [];
    const repoList = repoConfigs.map(parseRepoString);
    const repoSet = new Set(repoList.map(r => r.toLowerCase()));

    const stats = {
        reposCount: repoList.length,
        itemsScanned: 0,
        acceptedCount: 0,
        timestamp: Date.now()
    };

    if (repoList.length === 0) {
        return { leaderboard: [], stats, error: 'No repositories found in REPOS configuration.' };
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FOSS-Weekend-Leaderboard-App'
    };

    if (env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
    } else {
        return { leaderboard: [], stats, error: 'GITHUB_TOKEN is missing' };
    }

    const userMap = new Map<string, LeaderboardEntry>();
    let errorOccurred: string | undefined;
    const allNodes: GQLNode[] = [];

    const toUTC = (ist: string) => new Date(ist).toISOString().split('.')[0] + 'Z';
    const startUTC = toUTC(START_TIME_IST);
    const endUTC = toUTC(END_TIME_IST);
    
    const issueQueryString = `org:iiitl is:issue created:${startUTC}..${endUTC}`;
    const prQueryString = `org:iiitl is:pr created:${startUTC}..${endUTC}`;
    console.log(`[GITHUB] Executing simplified Org Query: ${issueQueryString}`);
    console.log(`[GITHUB] Executing simplified Org Query: ${prQueryString}`);

    const gqlQuery = `
        query($queryString: String!, $cursor: String) {
            search(query: $queryString, type: ISSUE, first: 100, after: $cursor) {
                issueCount
                pageInfo {
                    hasNextPage
                    endCursor
                }
                nodes {
                    ... on PullRequest {
                        __typename
                        title
                        url
                        number
                        createdAt
                        author {
                            login
                            avatarUrl
                        }
                        repository {
                            nameWithOwner
                        }
                        labels(first: 20) {
                            nodes {
                                name
                            }
                        }
                        authorAssociation
                    }
                    ... on Issue {
                        __typename
                        title
                        url
                        number
                        createdAt
                        author {
                            login
                            avatarUrl
                        }
                        repository {
                            nameWithOwner
                        }
                        labels(first: 20) {
                            nodes {
                                name
                            }
                        }
                        authorAssociation
                    }
                }
            }
        }
    `;

    try {
        const fetchQuery = async (queryStr: string) => {
            let hasNextPage = true;
            let cursor: string | null = null;
            let pageCount = 0;
            const nodes: GQLNode[] = [];

            while (hasNextPage && pageCount < (MAX_PAGES_TO_FETCH || 15)) {
                pageCount++;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);

                const response = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ query: gqlQuery, variables: { queryString: queryStr, cursor } }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`GitHub API HTTP error: ${response.status}`);
                }

                const result = (await response.json()) as GQLSearchResponse;
                
                if (result.errors) {
                    throw new Error(`GraphQL Error: ${result.errors[0]?.message}`);
                }

                const searchData = result.data.search;
                const validNodes = searchData.nodes.filter((node): node is GQLNode => node !== null);
                nodes.push(...validNodes);
                
                hasNextPage = searchData.pageInfo.hasNextPage;
                cursor = searchData.pageInfo.endCursor;
            }
            return nodes;
        };

        // --- 1. DATA FETCHING ---
        console.log(`[GITHUB] Fetching Issues...`);
        const issueNodes = await fetchQuery(issueQueryString);
        console.log(`[GITHUB] Found ${issueNodes.length} issues.`);

        console.log(`[GITHUB] Fetching Pull Requests...`);
        const prNodes = await fetchQuery(prQueryString);
        console.log(`[GITHUB] Found ${prNodes.length} pull requests.`);

        allNodes.push(...issueNodes, ...prNodes);

        stats.itemsScanned = allNodes.length;
        console.log(`[GITHUB] Fetch complete. Evaluating ${allNodes.length} total items against REPOS list...`);

        // --- 2. DATA EVALUATION LOOP (Wrapped in the try-catch to prevent freezes!) ---
        for (const node of allNodes) {
            if (!node || !node.author || !node.repository) continue;

            const repoNameWithOwner = node.repository.nameWithOwner.toLowerCase();
            
            // Skip it if it's not in our explicit target list
            if (!repoSet.has(repoNameWithOwner)) {
                // Uncomment the line below if you want to see exactly which repos are being ignored
                // console.log(`[DEBUG] Ignored ${repoNameWithOwner}: Not in REPOS set.`);
                continue;
            }

            const labels = node.labels?.nodes || [];
            
            // Safely check prefixes
            const validPrefixes = ACCEPTED_LABEL_PREFIXES || [];
            const acceptedLabel = labels.find((l) =>
                l.name &&
                validPrefixes.some((prefix) =>
                    l.name.toLowerCase().includes(prefix.toLowerCase())
                )
            );

            if (!acceptedLabel) {
                console.log(`[DEBUG] Rejected PR #${node.number} in ${repoNameWithOwner}: No accepted label found.`);
                continue;
            }

            const isPR = node.url.includes('/pull/');
            const authorRole = node.authorAssociation;
            
            // Safely check ignored associations
            const ignoreList = IGNORED_AUTHOR_ASSOCIATIONS || [];
            const isIgnoredAuthor = authorRole && ignoreList.includes(authorRole);
            
            if (!isPR && isIgnoredAuthor) {
                console.log(`[DEBUG] Rejected Issue #${node.number} in ${repoNameWithOwner}: Author role '${authorRole}' is ignored for issues.`);
                continue;
            }

            stats.acceptedCount++;
            const pointsMatch = acceptedLabel.name.toLowerCase().match(/\d+/);
            
            if (pointsMatch) {
                const points = parseInt(pointsMatch[0], 10);
                const login = node.author.login;

                if (!userMap.has(login)) {
                    userMap.set(login, {
                        username: login,
                        avatarUrl: node.author.avatarUrl,
                        score: 0,
                        lastContributionTime: 0,
                        contributions: []
                    });
                }

                const userEntry = userMap.get(login)!;
                const submissionTime = new Date(node.createdAt).getTime();
                if (submissionTime > userEntry.lastContributionTime) {
                    userEntry.lastContributionTime = submissionTime;
                }
                
                const repoConfig = repoConfigs.find(
                    (r) => parseRepoString(r).toLowerCase() === repoNameWithOwner
                );
                
                const finalRepoName = repoConfig ? (typeof repoConfig === 'string' ? repoConfig : repoConfig.name) : node.repository.nameWithOwner;
                const isSpecialRepo = typeof repoConfig !== 'string' && repoConfig?.special ? true : false;
                
                let specialPoints = 0;
                let specialTag = undefined;

                if (isSpecialRepo) {
                    const safeSpecialPrefix = (SPECIAL_LABEL_PREFIX || '').toLowerCase();
                    const specialLabel = labels.find((l) =>
                        l.name && safeSpecialPrefix && l.name.toLowerCase().startsWith(safeSpecialPrefix)
                    );
                    if (specialLabel) {
                        specialTag = specialLabel.name;
                        const match = specialTag.match(new RegExp(`${safeSpecialPrefix}(\\d+)`, 'i'));
                        if (match) {
                            specialPoints = parseInt(match[1], 10);
                        }
                    }
                }

                userEntry.score += (points + specialPoints);

                const aiLabelNode = labels.find((l) => l.name && l.name.toLowerCase().includes('ai'));
                
                userEntry.contributions.push({
                    title: node.title,
                    url: node.url,
                    points: points,
                    repo_name: finalRepoName,
                    issue_number: node.number,
                    type: isPR ? 'PR' : 'Issue',
                    isAI: !!aiLabelNode,
                    aiLabel: aiLabelNode?.name,
                    createdAt: node.createdAt,
                    specialTag,
                    specialPoints
                });
                
                console.log(`[DEBUG] Successfully assigned ${points} pts to ${login} for PR/Issue #${node.number}`);
            } else {
                console.log(`[DEBUG] Warning: Found accepted label '${acceptedLabel.name}' but could not extract a number from it.`);
            }
        }
        
        console.log(`[GITHUB] Processing completed successfully. Total accepted items: ${stats.acceptedCount}`);

    } catch (e: unknown) {
        console.error("[GITHUB] Processing failed abruptly with error:", e);
        errorOccurred = e instanceof Error ? e.message : "Unknown error during GitHub sync.";
    }

    if (errorOccurred && allNodes.length === 0) {
        return { leaderboard: [], stats, error: errorOccurred };
    }

    const results = Array.from(userMap.values());
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Tie-breaker: earlier last submission wins
        return a.lastContributionTime - b.lastContributionTime || a.username.localeCompare(b.username);
    });

    return {
        leaderboard: results,
        stats,
        error: errorOccurred
    };
}
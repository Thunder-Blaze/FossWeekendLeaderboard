export interface RepoConfig {
	name: string;
	special?: boolean;
}

export const REPOS: RepoConfig[] = [{ name: 'iiitl/student-hub', special: true }];

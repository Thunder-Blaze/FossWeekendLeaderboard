<script lang="ts">
	import type { PageData } from './$types';
	import type { LeaderboardEntry, ContributionEntry } from '$lib/server/github';
	import TopRank from '$lib/components/TopRank.svelte';
	import LeaderboardCard from '$lib/components/LeaderboardCard.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { HOMEPAGE_URL, REFRESH_INTERVAL_MS } from '$lib/constants';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { navigating } from '$app/stores';

	let { data } = $props<{ data: PageData }>();
	let searchTerm = $state('');
	let expandedUsername = $state<string | null>(null);
	let showOnlyAI = $state(false);

	let leaderboard = $derived(data.leaderboard || []);

	let filteredLeaderboard = $derived(
		leaderboard
			.map((user: LeaderboardEntry) => {
				if (!showOnlyAI) return user;
				const aiContributions = user.contributions.filter((c) => c.isAI);
				if (aiContributions.length === 0) return null;
				// Return a copy with only AI contributions and updated score for the filtered view
				return {
					...user,
					contributions: aiContributions,
					score: aiContributions.reduce(
						(sum: number, c: ContributionEntry) => sum + (c.isAI ? c.points : 0),
						0
					)
				};
			})
			.filter((user: LeaderboardEntry | null): user is LeaderboardEntry => user !== null)
			.filter(
				(user: LeaderboardEntry) =>
					user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.contributions.some((c) =>
						c.repo_name.toLowerCase().includes(searchTerm.toLowerCase())
					)
			)
	);

	let topUser = $derived(filteredLeaderboard[0]);
	let rest = $derived(filteredLeaderboard.slice(1));

	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => {
			invalidateAll();
		}, REFRESH_INTERVAL_MS);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<svelte:head>
	<title>FOSS Weekend Leaderboard</title>
</svelte:head>

<!-- Outer background: super dark, nearly black -->
<div
	class="min-h-screen bg-[#0E0E11] font-sans text-white selection:bg-[#ccff00] selection:text-black"
>
	<!-- Floating visual decorative elements (from Image 3) -->
	<div
		class="pointer-events-none fixed top-10 left-[-2rem] h-20 w-20 rounded-full bg-[#ccff00] opacity-20 blur-xl"
	></div>
	<div
		class="pointer-events-none fixed top-[40%] right-[-1rem] flex h-16 w-16 rounded-full bg-[#ccff00] opacity-10 blur-lg"
	></div>
	<div
		class="pointer-events-none fixed bottom-20 left-10 h-10 w-10 rounded-full bg-cyan-400 text-transparent opacity-20 blur-md"
	></div>

	<div
		class="relative z-10 container mx-auto max-w-[1600px] px-4 py-8 sm:px-8 md:px-16 lg:px-32 lg:py-16 xl:px-48 2xl:px-64"
	>
		<header class="mb-8 space-y-3 text-center sm:mb-12">
			<!-- Added some colorful circles in header if desired -->
			<h1
				class="bg-gradient-to-r from-[#94a3b8] to-[#f8fafc] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-5xl"
			>
				Leaderboard <span class="text-4xl">👑</span>
			</h1>
			<p class="text-base font-medium text-white/50">
				Tracking extraordinary open-source contributions
			</p>
		</header>

		{#if data.error}
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-[#1a1a1a] p-12 shadow-2xl"
			>
				<div class="mb-4 text-4xl text-red-500">⚠️</div>
				<h2 class="mb-2 text-xl font-bold text-white">GitHub API Error</h2>
				<p class="max-w-md text-center text-white/70">{data.error}</p>
				<button
					onclick={() => invalidateAll()}
					class="mt-6 rounded-xl bg-white/10 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
				>
					Try Again
				</button>
			</div>
		{:else if leaderboard.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] p-12 shadow-2xl"
			>
				{#if $navigating}
					<div class="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#ccff00]"></div>
					<p class="text-[#ccff00]/80">Synchronizing with GitHub...</p>
				{:else}
					<div class="mb-4 text-4xl opacity-50">📊</div>
					<p class="text-white/50">No data for statistics</p>
					<button
						onclick={() => invalidateAll()}
						class="mt-6 rounded-xl bg-white/10 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
					>
						Refresh
					</button>
				{/if}
			</div>
		{:else}
			{#if $navigating}
				<div
					class="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-full border border-white/10 bg-black/80 px-4 py-2 backdrop-blur-md"
					transition:fade
				>
					<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-[#ccff00]"></div>
					<span class="text-xs font-medium text-[#ccff00]">Updating...</span>
				</div>
			{/if}

			<!-- Top 1 Display -->
			{#if searchTerm === '' && topUser}
				<TopRank
					user={topUser}
					isExpanded={expandedUsername === topUser.username}
					onToggle={() =>
						(expandedUsername = expandedUsername === topUser.username ? null : topUser.username)}
				/>
			{/if}

			<!-- Search Bar & Filters -->
			<div class="mb-10 flex w-full flex-col gap-4 sm:flex-row sm:items-stretch">
				<div class="relative flex-1">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
						<svg class="h-6 w-6 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search a contributor..."
						class="block h-full w-full rounded-2xl border border-white/10 bg-[#1a1a1a] py-4 pr-5 pl-14 text-lg text-white placeholder-zinc-500 transition-all duration-300 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] focus:outline-none"
					/>
				</div>

				<button
					onclick={() => (showOnlyAI = !showOnlyAI)}
					class="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-4 transition-all duration-300 hover:bg-white/5 {showOnlyAI
						? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
						: 'bg-[#1a1a1a] text-zinc-400'}"
				>
					<span class="text-sm font-bold tracking-wider uppercase">AI Filter</span>
					<div
						class="h-2 w-2 rounded-full {showOnlyAI
							? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
							: 'bg-zinc-600'}"
					></div>
				</button>
			</div>

			<!-- Leaderboard List -->
			<div class="flex w-full flex-col">
				{#each searchTerm === '' ? rest : filteredLeaderboard as entry (entry.username)}
					<!-- Find their absolute rank across the entire leaderboard -->
					{@const absoluteRank =
						leaderboard.findIndex((l: LeaderboardEntry) => l.username === entry.username) + 1}
					<div animate:flip={{ duration: 300 }} transition:fade>
						<LeaderboardCard
							user={entry}
							rank={absoluteRank}
							isExpanded={expandedUsername === entry.username}
							onToggle={() =>
								(expandedUsername = expandedUsername === entry.username ? null : entry.username)}
						/>
					</div>
				{:else}
					{#if searchTerm !== ''}
						<div
							class="rounded-2xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-zinc-500"
						>
							No matches found for "{searchTerm}"
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<footer class="mt-16 text-center text-xs text-zinc-600 sm:text-sm">
			<p class="mb-2">Data refreshes automatically • Live cached sync</p>
			<p>
				Visit the
				<a
					href={HOMEPAGE_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="text-zinc-400 transition-colors hover:text-[#ccff00] hover:underline"
				>
					FOSS Weekend Homepage
				</a>
			</p>
		</footer>
	</div>
</div>

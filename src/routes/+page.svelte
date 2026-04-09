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
	import { cubicOut } from 'svelte/easing';
	import { spring } from 'svelte/motion';
	import { navigating } from '$app/stores';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props<{ data: PageData }>();
	let searchTerm = $state('');
	let expandedUsername = $state<string | null>(null);
	let showOnlyAI = $state(false);

	let buttonScale = spring(1, {
		stiffness: 0.2,
		damping: 0.4
	});

	function handleFilterClick() {
		showOnlyAI = !showOnlyAI;
		buttonScale.set(1.2).then(() => buttonScale.set(1));
	}

	function handleRefresh() {
		buttonScale.set(0.95).then(() => buttonScale.set(1));
		goto(`?refresh=${Date.now()}`, { invalidateAll: true });
	}

	let isLoading = $derived(!!$navigating);


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
						(sum: number, c: ContributionEntry) => sum + (c.isAI ? (c.points + (c.specialPoints || 0)) : 0),
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

<div class="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary-container selection:text-on-primary-container">
	<!-- Dynamic Material You background shapes -->
	<div
		class="pointer-events-none fixed top-[5%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary/10 blur-[120px]"
	></div>
	<div
		class="pointer-events-none fixed bottom-[10%] right-[-5%] h-[30vw] w-[30vw] rounded-full bg-tertiary/10 blur-[100px]"
	></div>

	<div class="relative z-10 container mx-auto max-w-[1200px] px-4 py-12 md:px-8 lg:py-20">
		<header class="mb-12 flex flex-col items-center text-center space-y-4">
			<div class="inline-flex items-center justify-center rounded-3xl bg-primary-container px-6 py-2 text-on-primary-container shadow-sm mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mr-2"
				>
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
				</svg>
				<span class="jetbrains-mono text-xs font-black tracking-widest uppercase">Leaderboard v2026</span>
			</div>
			
			<h1
				class="rubik text-5xl font-black tracking-tight text-primary drop-shadow-sm sm:text-7xl lg:text-8xl"
			>
				FOSS Weekend
			</h1>
			<p class="max-w-xl text-lg font-medium text-on-surface-variant/70 leading-relaxed">
				Recognizing extraordinary contributions to the open-source ecosystem during the weekend sprint.
			</p>
		</header>

		{#if data.error}
			<div
				class="flex flex-col items-center justify-center rounded-[2.5rem] border border-outline-variant bg-surface-container p-12 text-center"
			>
				<div class="mb-6 rounded-full bg-tertiary-container p-6 text-on-tertiary-container text-4xl">⚠️</div>
				<h2 class="mb-2 text-2xl font-bold">Connection Terminated</h2>
				<p class="max-w-md text-on-surface-variant">{data.error}</p>
				<button
					onclick={() => invalidateAll()}
					class="mt-8 rounded-full bg-primary px-8 py-3 font-bold text-on-primary transition-all hover:scale-105 active:scale-95"
				>
					Reconnect
				</button>
			</div>
		{:else if leaderboard.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-[2.5rem] border border-outline-variant bg-surface-container p-12 shadow-xl sm:p-20"
			>
				{#if $navigating}
					<div class="mb-10 relative">
						<div class="h-24 w-24 animate-[spin_3s_linear_infinite] rounded-full border-[8px] border-primary/20 border-t-primary shadow-lg"></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-pulse"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
						</div>
					</div>
					
					<h2 class="mb-4 text-3xl font-black text-primary animate-pulse italic">Synchronizing Origin...</h2>
				{:else}
					<div class="mb-8 rounded-full bg-surface-variant/30 p-8">
						<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-on-surface-variant/30"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
					</div>
					<h2 class="mb-4 text-3xl font-black text-on-surface">No Contributions Detected</h2>
					
					<p class="mb-8 max-w-md text-on-surface-variant/70 text-lg">
						No contributions matched the accepted criteria in the monitored repositories for this weekend.
					</p>
					
					<button
						onclick={handleRefresh}
						class="rounded-full bg-primary px-10 py-4 font-black text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
					>
						Re-scan Ecosystem
					</button>

					{#if data.stats?.timestamp}
						<p class="mt-6 jetbrains-mono text-[9px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em]">
							Snapshot: {new Date(data.stats.timestamp).toLocaleTimeString()}
						</p>
					{/if}
				{/if}
			</div>
		{:else}
			{#if isLoading}
				<div
					class="fixed inset-x-0 top-0 z-[100] h-1.5 bg-primary/20"
					transition:fade
				>
					<div class="h-full bg-primary animate-[loading_2s_infinite_linear] shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"></div>
				</div>

				<div
					class="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-primary px-8 py-4 text-on-primary shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-4 ring-white/10 backdrop-blur-3xl animate-bounce"
					transition:fade
				>
					<div class="h-6 w-6 animate-[spin_1s_linear_infinite]">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
					</div>
					<div class="flex flex-col">
						<span class="jetbrains-mono text-[11px] font-black tracking-[0.3em] uppercase">Origin Synchronization</span>
						<span class="text-[9px] font-medium opacity-70 uppercase tracking-widest">Processing GraphQL Nodes...</span>
					</div>
				</div>
			{/if}

			<!-- Top 1 Display -->
			{#if searchTerm === '' && topUser}
				<TopRank user={topUser} />
			{/if}

			<!-- Search Bar & Filters (MD3 Expressive) -->
			<div class="mb-12 flex w-full flex-col gap-4 sm:flex-row sm:items-stretch">
				<div class="relative flex-1 group">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
						<svg class="h-6 w-6 text-primary/60 transition-colors group-focus-within:text-primary" viewBox="0 0 20 20" fill="currentColor">
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
						placeholder="Find a contributor..."
						class="jetbrains-mono block w-full rounded-[2rem] border-2 border-transparent bg-surface-container-high py-5 pr-6 pl-16 text-lg text-on-surface placeholder-on-surface-variant/50 transition-all duration-300 focus:border-primary focus:bg-surface focus:outline-none focus:shadow-[0_0_0_4px_oklch(var(--color-primary)/0.1)]"
					/>
				</div>

				<button
					onclick={handleFilterClick}
					style="transform: scale({$buttonScale})"
					class="flex items-center justify-center gap-3 rounded-[2rem] px-8 py-5 font-black tracking-tight transition-all duration-300 active:scale-95 {showOnlyAI
						? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
						: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}"
				>
					<span class="jetbrains-mono text-sm uppercase">AI Filter</span>
					{#if showOnlyAI}
						<div class="h-2 w-2 rounded-full bg-on-primary animate-pulse"></div>
					{:else}
						<div class="h-2 w-2 rounded-full bg-outline-variant"></div>
					{/if}
				</button>
			</div>

			<!-- Leaderboard List -->
			<div class="flex w-full flex-col pb-20">
				{#each filteredLeaderboard as entry, i (entry.username)}
					<!-- Find their absolute rank across the entire leaderboard -->
					{@const absoluteRank =
						leaderboard.findIndex((l: LeaderboardEntry) => l.username === entry.username) + 1}
					<div 
						animate:flip={{ duration: 600, easing: cubicOut }} 
						transition:fade={{ delay: i * 50, duration: 400 }}
					>
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
							class="rounded-[2.5rem] bg-surface-container p-12 text-center text-on-surface-variant/50 border-2 border-dashed border-outline-variant/30"
						>
							<div class="text-4xl mb-4 opacity-20">🔍</div>
							No contributors found matching <span class="text-primary font-black">"{searchTerm}"</span>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<footer class="mt-8 pb-12 text-center space-y-6">
			<div class="flex flex-col items-center gap-2">
				<div class="h-1 w-12 rounded-full bg-primary/20"></div>
				<p class="jetbrains-mono text-[10px] font-black tracking-[0.4em] text-on-surface-variant/40 uppercase">
					Automated Synchronized State
				</p>
			</div>
			
			<p class="text-on-surface-variant/60">
				Build with precision for the 
				<a
					href={HOMEPAGE_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="font-black text-primary transition-all hover:text-tertiary hover:underline underline-offset-8"
				>
					FOSS Weekend
				</a>
			</p>
		</footer>
	</div>
</div>

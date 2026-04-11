<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { fade, fly } from 'svelte/transition';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let stats = $derived(form?.stats || data.stats);
	let timestamp = $derived(form?.timestamp || data.timestamp);
	let isRefreshing = $state(false);

	const groupColors: Record<string, string> = {
		WEB: 'border-primary text-primary bg-primary-container/10',
		APP: 'border-tertiary text-tertiary bg-tertiary-container/10',
		ML: 'border-secondary text-secondary bg-secondary-container/10',
		FOSS: 'border-outline text-on-surface bg-surface-variant/20',
		WEB3: 'border-primary text-on-primary-container bg-primary-container/30',
		SPECIAL: 'border-tertiary text-on-tertiary-container bg-tertiary-container/50',
		'GIT-BASH': 'border-secondary text-secondary-container bg-secondary-container/50'
	};

	function formatTime(ms: number) {
		return new Date(ms).toLocaleString('en-IN', {
			timeZone: 'Asia/Kolkata',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			day: '2-digit',
			month: 'short'
		});
	}
</script>

<svelte:head>
	<title>Repository Stats | Groups</title>
</svelte:head>

<div class="min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-12">
	<!-- Header Section -->
	<header class="flex flex-col md:flex-row md:items-end justify-between gap-6" in:fly={{ y: -20, duration: 800 }}>
		<div>
			<h1 class="text-4xl md:text-6xl font-black text-on-surface tracking-tighter uppercase rubik">
				Group <span class="text-primary italic">Stats</span>
			</h1>
			<p class="text-on-surface-variant text-lg mt-2 jetbrains-mono"> Breakdown of contributions by category </p>
		</div>

		<div class="flex flex-col items-end gap-2">
			<form
				method="POST"
				action="?/refresh"
				use:enhance={() => {
					isRefreshing = true;
					return async ({ update }) => {
						await update();
						isRefreshing = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={isRefreshing}
					class="px-8 py-3 bg-primary text-on-primary font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
				>
					{#if isRefreshing}
						<div class="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
						Refreshing...
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
						Refresh Data
					{/if}
				</button>
			</form>
			<p class="text-xs text-outline italic jetbrains-mono">
				Last synced: {formatTime(timestamp)}
			</p>
		</div>
	</header>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each stats as group, i (group.group)}
			<div
				in:fly={{ y: 20, delay: i * 100, duration: 600 }}
				class="group relative bg-surface-container-high border-b-4 {groupColors[group.group] || 'border-outline'} p-8 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500"
			>
				<!-- Decorative Background Text -->
				<span class="absolute -right-4 -bottom-4 text-8xl font-black opacity-5 select-none uppercase tracking-tighter">
					{group.group}
				</span>

				<div class="relative z-10 flex flex-col h-full">
					<div class="flex justify-between items-start mb-6">
						<span class="px-3 py-1 text-xs font-black uppercase tracking-widest border {groupColors[group.group] || 'border-outline'} rounded-full jetbrains-mono">
							{group.group}
						</span>
						<span class="text-5xl font-black tracking-tighter jetbrains-mono text-on-surface">
							{group.prCount}
						</span>
					</div>

					<h3 class="text-lg font-bold text-on-surface uppercase mb-4 tracking-wide rubik">
						Pull Requests
					</h3>

					<div class="mt-auto">
						<p class="text-xs text-on-surface-variant jetbrains-mono uppercase tracking-widest">
							{group.repos.length} Repositories
						</p>
						<div class="mt-2 flex flex-wrap gap-1">
							{#each group.repos.slice(0, 3) as repo (repo)}
								<span class="px-2 py-0.5 bg-surface-variant text-[10px] rounded text-on-surface-variant">
									{repo}
								</span>
							{/each}
							{#if group.repos.length > 3}
								<span class="px-2 py-0.5 bg-surface-variant/50 text-[10px] rounded text-outline italic">
									+{group.repos.length - 3} more
								</span>
							{/if}
						</div>
					</div>
				</div>
				
				<!-- Animated Progress Bar (Hover) -->
				<div class="absolute bottom-0 left-0 h-1 bg-current opacity-0 group-hover:opacity-100 transition-opacity w-full"></div>
			</div>
		{/each}
	</div>

	<!-- Footer Info -->
	<footer class="text-center pt-12 pb-6 border-t border-outline-variant" in:fade={{ delay: 1000 }}>
		<p class="text-outline text-sm jetbrains-mono">
			Data is cached server-side to prevent GitHub API rate limits.<br>
			The organization is <strong>iiitl</strong>
		</p>
	</footer>
</div>

<style>
	h1 {
		line-height: 0.9;
	}
</style>

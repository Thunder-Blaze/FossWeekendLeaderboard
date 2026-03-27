<script lang="ts">
	import type { LeaderboardEntry } from '$lib/server/github';
	import { slide } from 'svelte/transition';
	import ContributionItem from './ContributionItem.svelte';

	let { user, rank, isExpanded, onToggle } = $props<{
		user: LeaderboardEntry;
		rank: number;
		isExpanded: boolean;
		onToggle: () => void;
	}>();

	let isRank1 = $derived(rank === 1);
	let isRank2 = $derived(rank === 2);
	let isRank3 = $derived(rank === 3);

	let borderStyle = $derived(
		isRank1
			? 'border border-accent/30'
			: isRank2
				? 'border border-accent/20'
				: isRank3
					? 'border border-accent/10'
					: 'border border-white/5'
	);

	let cardClass = $derived(
		isExpanded
			? 'bg-bg-container hover:bg-bg-container shadow-2xl scale-[1.01]'
			: 'bg-bg-alt hover:bg-bg-alt-hover'
	);
</script>

<div
	class="mb-4 overflow-hidden rounded-[2rem] transition-all duration-300 {cardClass} {borderStyle} text-white"
>
	<button
		class="flex w-full cursor-pointer items-center justify-between rounded-[2rem] bg-bg-container p-7 px-6 text-left focus:outline-none sm:px-8"
		onclick={onToggle}
	>
		<div class="flex w-3/4 items-center gap-4 sm:gap-6">
			<a
				href="https://github.com/{user.username}"
				target="_blank"
				rel="noopener noreferrer"
				class="relative z-10 flex-shrink-0"
				onclick={(e) => e.stopPropagation()}
			>
				<div
					class="relative h-10 w-10 overflow-hidden rounded-full border-2 border-accent/20 transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
				>
					{#if user.avatarUrl}
						<img src={user.avatarUrl} alt={user.username} class="h-full w-full object-cover" />
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-accent text-xl font-bold text-black sm:text-2xl"
						>
							{user.username.substring(0, 2).toUpperCase()}
						</div>
					{/if}
				</div>
			</a>
			<div class="overflow-hidden">
				<h3 class="rubik truncate text-lg font-bold tracking-tight sm:text-2xl">{user.username}</h3>
				<p class="jetbrains-mono mt-0.5 text-xs font-bold text-accent-80 sm:text-sm">
					{user.score} points
				</p>
			</div>
		</div>

		<div
			class="jetbrains-mono flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-black shadow-inner transition-transform duration-300 sm:h-14 sm:w-14 sm:text-xl
			{isRank1
				? 'scale-110 bg-accent text-black shadow-[0_0_20px_rgba(77,238,234,0.5)]'
				: isRank2
					? 'bg-accent-80 text-black shadow-[0_0_15px_rgba(77,238,234,0.3)]'
					: isRank3
						? 'bg-accent-60 text-black/80'
						: 'bg-white/5 text-gray-400'}"
		>
			{rank}
		</div>
	</button>

	{#if isExpanded}
		<div transition:slide={{ duration: 300 }} class="bg-bg-container/50 px-4 pb-6 sm:px-8">
			<div class="mb-4 flex items-center gap-3">
				<div class="h-px flex-1 bg-white/5"></div>
				<span class="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
					Contributions
				</span>
				<div class="h-px flex-1 bg-white/5"></div>
			</div>

			{#if user.contributions.length > 0}
				<div class="grid gap-3 sm:gap-4">
					{#each user.contributions as entry (entry.url)}
						<ContributionItem {entry} />
					{/each}
				</div>
			{:else}
				<p class="py-2 text-center text-xs text-white/20 italic">No points recorded.</p>
			{/if}
		</div>
	{/if}
</div>

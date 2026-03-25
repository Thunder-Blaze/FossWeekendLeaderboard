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

	let isRank2 = $derived(rank === 2);
	let isRank3 = $derived(rank === 3);

	let borderStyle = $derived(
		isRank2
			? 'border border-gray-300/20'
			: isRank3
				? 'border border-amber-600/20'
				: 'border border-white/5'
	);

	let cardClass = $derived(
		isExpanded
			? 'bg-[#1a1a1a] hover:bg-[#1a1a1a] shadow-2xl scale-[1.01]'
			: 'bg-[#18181b] hover:bg-[#202023]'
	);
</script>

<div
	class="mb-4 overflow-hidden rounded-[2rem] transition-all duration-300 {cardClass} {borderStyle} text-white"
>
	<button
		class="flex w-full cursor-pointer items-center justify-between rounded-[2rem] p-4 px-6 text-left focus:outline-none sm:px-8"
		onclick={onToggle}
	>
		<div class="flex w-3/4 items-center gap-4 sm:gap-6">
			{#if user.avatarUrl}
				<img
					src={user.avatarUrl}
					alt={user.username}
					class="h-12 w-12 flex-shrink-0 rounded-full object-cover shadow-lg sm:h-16 sm:w-16
					{isRank2
						? 'ring-2 ring-gray-300 ring-offset-2 ring-offset-transparent'
						: isRank3
							? 'ring-2 ring-amber-600 ring-offset-2 ring-offset-transparent'
							: 'border border-white/5'}"
				/>
			{:else}
				<div
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-black shadow-lg sm:h-16 sm:w-16"
				>
					<span class="text-lg font-black">{user.username.substring(0, 2).toUpperCase()}</span>
				</div>
			{/if}
			<div class="overflow-hidden">
				<h3 class="truncate text-lg font-bold tracking-tight sm:text-2xl">{user.username}</h3>
				<p class="mt-0.5 text-xs font-bold text-[#ccff00] sm:text-sm">{user.score} points</p>
			</div>
		</div>

		<div
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-black shadow-inner transition-transform duration-300 sm:h-14 sm:w-14 sm:text-xl
			{isRank2
				? 'bg-gradient-to-br from-gray-100 to-gray-400 text-gray-900'
				: isRank3
					? 'bg-gradient-to-br from-amber-400 to-amber-700 text-amber-50'
					: 'bg-white/5 text-gray-400'}"
		>
			{rank}
		</div>
	</button>

	{#if isExpanded}
		<div transition:slide={{ duration: 300 }} class="px-5 pb-6 sm:px-8">
			<div class="mb-4 flex items-center gap-3">
				<div class="h-px flex-1 bg-white/10"></div>
				<h4 class="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
					Contributions
				</h4>
				<div class="h-px flex-1 bg-white/10"></div>
			</div>

			{#if user.contributions.length > 0}
				<div class="grid gap-3">
					{#each user.contributions as entry}
						<ContributionItem {entry} />
					{/each}
				</div>
			{:else}
				<p class="py-2 text-center text-xs text-white/20 italic">No points recorded.</p>
			{/if}
		</div>
	{/if}
</div>

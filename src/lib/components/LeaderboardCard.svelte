<script lang="ts">
	import type { LeaderboardEntry } from '$lib/server/github';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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

	let surfaceClass = $derived(
		isExpanded
			? 'bg-surface-container-high shadow-xl ring-2 ring-primary/20'
			: 'bg-surface-container hover:bg-surface-container-high hover:scale-[1.01]'
	);
</script>

<div
	class="mb-4 overflow-hidden rounded-[2.5rem] transition-all duration-500 {surfaceClass} text-on-surface"
>
	<button
		class="flex w-full cursor-pointer items-center justify-between p-6 px-7 text-left focus:outline-none sm:px-10 sm:py-8"
		onclick={onToggle}
	>
		<div class="flex w-3/4 items-center gap-5 sm:gap-8">
			<a
				href="https://github.com/{user.username}"
				target="_blank"
				rel="noopener noreferrer"
				class="relative z-10 flex-shrink-0"
				onclick={(e) => e.stopPropagation()}
			>
				<div
					class="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-primary/10 transition-all duration-300 hover:scale-110 hover:rounded-xl sm:h-20 sm:w-20"
				>
					{#if user.avatarUrl}
						<img src={user.avatarUrl} alt={user.username} class="h-full w-full object-cover" />
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-secondary-container text-2xl font-black text-on-secondary-container sm:text-3xl"
						>
							{user.username.substring(0, 2).toUpperCase()}
						</div>
					{/if}
				</div>
			</a>
			<div class="overflow-hidden">
				<h3 class="rubik truncate text-xl font-black tracking-tight text-on-surface sm:text-3xl">
					{user.username}
				</h3>
				<div class="mt-1 flex items-center gap-2">
					<span
						class="jetbrains-mono rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-primary uppercase sm:text-xs"
					>
						{user.score} PTS
					</span>
					{#if isRank1}
						<span
							class="rounded-lg bg-tertiary-container px-2 py-0.5 text-[10px] font-bold text-on-tertiary-container sm:text-xs"
						>
							WEEKEND CHAMPION
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div
			class="jetbrains-mono flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-inner transition-all duration-300 sm:h-16 sm:w-16 sm:text-3xl
			{isRank1
				? 'scale-110 rotate-6 bg-primary text-on-primary'
				: isRank2
					? 'rotate-3 bg-secondary text-on-secondary'
					: isRank3
						? '-rotate-3 bg-tertiary text-on-tertiary'
						: 'bg-surface-variant text-on-surface-variant opacity-60'}"
		>
			{rank}
		</div>
	</button>

	{#if isExpanded}
		<div transition:slide={{ duration: 400, easing: cubicOut }} class="px-7 pb-8 sm:px-10">
			<div class="mb-6 flex items-center gap-4">
				<div class="h-0.5 flex-1 bg-outline-variant/30"></div>
				<span
					class="jetbrains-mono text-[10px] font-black tracking-[0.3em] text-on-surface-variant/40 uppercase"
				>
					Activity Log
				</span>
				<div class="h-0.5 flex-1 bg-outline-variant/30"></div>
			</div>

			{#if user.contributions.length > 0}
				<div class="grid gap-4">
					{#each user.contributions as entry (entry.url)}
						<ContributionItem {entry} />
					{/each}
				</div>
			{:else}
				<div
					class="rounded-3xl bg-surface-variant/20 py-8 text-center text-sm font-medium text-on-surface-variant/50 italic"
				>
					No recent activity recorded
				</div>
			{/if}
		</div>
	{/if}
</div>

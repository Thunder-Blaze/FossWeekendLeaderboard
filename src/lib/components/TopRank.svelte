<script lang="ts">
	import type { LeaderboardEntry } from '$lib/server/github';
	import { slide } from 'svelte/transition';
	import ContributionItem from './ContributionItem.svelte';

	let { user, isExpanded, onToggle } = $props<{
		user: LeaderboardEntry;
		isExpanded: boolean;
		onToggle: () => void;
	}>();
</script>

<div class="mb-12 flex w-full flex-col items-center pt-8 text-white">
	<!-- Avatar with Custom SVG Blob Backdrop -->
	<button
		class="group relative mb-8 cursor-pointer focus:outline-none"
		onclick={onToggle}
		title="Click to view details"
	>
		<!-- Custom SVG Blob (centered exactly) -->
		<div
			class="absolute -inset-10 z-0 flex scale-[0.85] items-center justify-center transition-transform duration-700 group-hover:scale-[0.92] group-hover:rotate-6 group-hover:rotate-180"
		>
			<svg
				viewBox="0 0 500 500"
				xmlns="http://www.w3.org/2000/svg"
				class="h-56 w-56 fill-[#ccff00] opacity-85 drop-shadow-[0_0_20px_rgba(204,255,0,0.4)] filter"
			>
				<path
					id="blob"
					d="M446.5,330.5Q411,411,330.5,431Q250,451,175,425.5Q100,400,64,325Q28,250,58,169Q88,88,169,67.5Q250,47,334,64.5Q418,82,450,166Q482,250,446.5,330.5Z"
				/>
			</svg>
		</div>

		<!-- Main Avatar centered over blob -->
		<div
			class="relative z-10 h-32 w-32 overflow-hidden rounded-full border-[6px] border-[#0E0E11] bg-zinc-900 shadow-2xl transition-transform duration-500 group-hover:scale-105"
		>
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt={user.username} class="h-full w-full object-cover" />
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-[#ccff00] text-4xl font-black text-black"
				>
					{user.username.substring(0, 2).toUpperCase()}
				</div>
			{/if}
		</div>
	</button>

	<!-- Name & Points -->
	<h2 class="mb-3 text-center text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl">
		{user.username}
	</h2>

	<div
		class="mb-2 rounded-full bg-[#ccff00] px-10 py-3 text-base font-black text-black shadow-[0_8px_20px_rgba(204,255,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_10px_25px_rgba(204,255,0,0.4)] sm:text-lg"
	>
		{user.score} points
	</div>

	<!-- Expandable PR Details for Top Rank -->
	{#if isExpanded}
		<div
			transition:slide={{ duration: 400 }}
			class="shadow-3xl mt-8 w-full max-w-2xl rounded-xl border border-white/5 bg-[#1a1a1a] p-6"
		>
			<div class="mb-5 flex items-center gap-3">
				<div class="h-px flex-1 bg-white/10"></div>
				<h4 class="text-[10px] font-black tracking-[0.2em] text-[#ccff00]/40 uppercase">
					Contributions
				</h4>
				<div class="h-px flex-1 bg-white/10"></div>
			</div>

			<div class="grid gap-3">
				{#each user.contributions as entry}
					<ContributionItem {entry} />
				{/each}
			</div>
		</div>
	{/if}
</div>

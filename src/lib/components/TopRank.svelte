<script lang="ts">
	import type { LeaderboardEntry } from '$lib/server/github';

	let { user } = $props<{
		user: LeaderboardEntry;
	}>();
</script>

<div class="mb-16 flex w-full flex-col items-center pt-8">
	<!-- Avatar with Expressive Shape Backdrop -->
	<div class="group relative mb-10 flex h-48 w-48 items-center justify-center">
		<!-- Main Avatar with High Elevation -->
		<div
			class="relative z-10 h-36 w-36 overflow-hidden rounded-[3rem] border-4 border-surface bg-surface-container-high shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-105 group-hover:rounded-[2rem]"
		>
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt={user.username} class="h-full w-full object-cover" />
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-primary text-4xl font-black text-on-primary"
				>
					{user.username.substring(0, 2).toUpperCase()}
				</div>
			{/if}
		</div>

		<!-- Rank 1 Badge -->
		<div
			class="absolute -right-2 -bottom-2 z-20 flex h-12 w-12 rotate-12 items-center justify-center rounded-2xl bg-tertiary text-xl font-black text-on-tertiary shadow-xl transition-transform group-hover:rotate-0"
		>
			1
		</div>
	</div>

	<!-- Name & Points -->
	<h2 class="rubik mb-4 text-center text-4xl font-black tracking-tight text-on-surface sm:text-6xl">
		{user.username}
	</h2>

	<div
		class="jetbrains-mono flex items-center gap-3 rounded-[2rem] bg-primary-container px-10 py-4 text-lg font-black text-on-primary-container shadow-lg transition-all hover:scale-105 hover:shadow-primary/20 sm:text-2xl"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="text-primary"
			><path
				d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
			/></svg
		>
		{user.score} <span class="text-sm tracking-widest opacity-70">PTS</span>
	</div>
</div>

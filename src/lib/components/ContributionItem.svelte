<script lang="ts">
	import type { ContributionEntry } from '$lib/server/github';
	import { TAG_COLORS } from '$lib/constants';

	let { entry } = $props<{ entry: ContributionEntry }>();
</script>

<a
	href={entry.url}
	target="_blank"
	rel="noopener noreferrer"
	class="group relative flex flex-col rounded-3xl bg-surface-container-high p-6 text-on-surface transition-all duration-300 hover:bg-surface-variant hover:scale-[1.02] active:scale-[0.98] border border-outline-variant/30"
>
	<div class="mb-4 flex w-full flex-wrap items-center justify-between gap-3">
		<button
			class="jetbrains-mono relative z-20 inline-flex items-center rounded-xl bg-primary/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary hover:text-on-primary sm:text-[11px]"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				window.open(`https://github.com/${entry.repo_name}`, '_blank');
			}}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
			{entry.repo_name}
		</button>
		
		<div class="flex items-center gap-2">
			{#if entry.isSpecial}
				<span class="jetbrains-mono rounded-lg {TAG_COLORS.SPECIAL} px-2.5 py-1 text-[9px] font-black sm:text-[10px] uppercase tracking-tighter shadow-sm">
					SPECIAL
				</span>
			{/if}
			{#if entry.isExternal}
				<span class="jetbrains-mono rounded-lg {TAG_COLORS.EXTERNAL} px-2.5 py-1 text-[9px] font-black sm:text-[10px] uppercase tracking-tighter shadow-sm">
					EXT {#if entry.repoStars}★{entry.repoStars}{/if}
				</span>
			{/if}
			{#if entry.isAI}
				<span class="jetbrains-mono rounded-lg {TAG_COLORS.AI} px-2.5 py-1 text-[9px] font-black sm:text-[10px] uppercase tracking-tighter shadow-sm animate-pulse">
					AI GEN
				</span>
			{/if}
			<span class="jetbrains-mono rounded-lg {TAG_COLORS.PTS} px-2.5 py-1 text-[9px] font-black sm:text-[10px] shadow-md">
				+{entry.points}
			</span>
		</div>
	</div>

	<h4 class="text-lg font-black leading-tight text-on-surface transition-colors group-hover:text-primary sm:text-xl">
		{entry.title}
	</h4>
	
	<div class="mt-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-on-surface-variant/40 uppercase">
		<span>{entry.type}</span>
		<div class="h-1 w-1 rounded-full bg-outline-variant"></div>
		<span>#{entry.issue_number}</span>
	</div>
</a>

<script lang="ts">
	import type { ContributionEntry } from '$lib/server/github';
	import { TAG_COLORS } from '$lib/constants';

	let { entry } = $props<{ entry: ContributionEntry }>();
</script>

<a
	href={entry.url}
	target="_blank"
	rel="noopener noreferrer"
	class="group relative flex flex-col rounded-2xl border border-white/5 bg-bg-card p-5 text-white shadow-lg transition-all duration-300 ease-in-out hover:border-accent/30 hover:bg-bg-card-hover hover:shadow-2xl"
>
	<div class="mb-3 flex w-full flex-wrap items-center justify-between gap-3 text-white">
		<span
			role="button"
			tabindex="0"
			class="jetbrains-mono relative z-30 inline-block rounded-lg bg-zinc-800/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase transition-all hover:bg-zinc-700 hover:text-white sm:text-[11px]"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				window.open(`https://github.com/${entry.repo_name}`, '_blank');
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					window.open(`https://github.com/${entry.repo_name}`, '_blank');
				}
			}}
		>
			{entry.repo_name}
		</span>
		<div class="flex items-center gap-2">
			{#if entry.isSpecial}
				<span
					class="mono-tag rounded-lg {TAG_COLORS.SPECIAL} px-2.5 py-1 text-[9px] text-black sm:text-[10px]"
				>
					SPECIAL
				</span>
			{/if}
			{#if entry.isExternal}
				<span
					class="mono-tag rounded-lg {TAG_COLORS.EXTERNAL} px-2.5 py-1 text-[9px] text-black sm:text-[10px]"
				>
					EXTERNAL {#if entry.repoStars}(★{entry.repoStars}){/if}
				</span>
			{/if}
			{#if entry.isAI}
				<span
					class="mono-tag rounded-lg {TAG_COLORS.AI} px-2.5 py-1 text-[9px] text-black sm:text-[10px]"
				>
					AI
				</span>
			{/if}
			<span
				class="mono-tag rounded-lg {entry.type === 'PR'
					? TAG_COLORS.PR
					: TAG_COLORS.ISSUE} px-2.5 py-1 text-[9px] text-black sm:text-[10px]"
			>
				{entry.type === 'PR' ? 'PR' : 'ISSUE'} #{entry.issue_number}
			</span>
			<span
				class="mono-tag rounded-lg {TAG_COLORS.PTS} px-2.5 py-1 text-[9px] text-black sm:text-[10px]"
			>
				+{entry.points} PTS
			</span>
		</div>
	</div>

	<h4
		class="text-base leading-snug font-bold text-zinc-100 transition-colors group-hover:text-accent sm:text-lg"
	>
		{entry.title}
	</h4>
</a>

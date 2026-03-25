<script lang="ts">
	import type { ContributionEntry } from '$lib/server/github';

	let { entry } = $props<{ entry: ContributionEntry }>();
</script>

<div
	class="transition-300 flex flex-col rounded-xl bg-white p-4 text-black shadow-xl transition-all duration-300 ease-in-out hover:bg-white/30 hover:text-white"
>
	<div class="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
		<a
			href="https://github.com/{entry.repo_name}"
			target="_blank"
			rel="noopener noreferrer"
			class="rounded-lg bg-black px-2.5 py-1 text-[9px] font-black tracking-wider text-white uppercase transition-colors hover:bg-black/10"
		>
			{entry.repo_name}
		</a>
		<div class="flex items-center gap-2">
			<span
				class="rounded-lg {entry.type === 'PR'
					? 'bg-indigo-600'
					: 'bg-emerald-600'} px-2.5 py-1 text-[9px] font-black text-white"
			>
				{entry.type === 'PR' ? 'PR' : 'ISSUE'} #{entry.issue_number}
			</span>
			<span class="rounded-lg bg-black px-2.5 py-1 text-[9px] font-black text-[#ccff00]">
				+{entry.points} PTS
			</span>
		</div>
	</div>
	<a
		href={entry.url}
		target="_blank"
		rel="noopener noreferrer"
		class="text-sm leading-snug font-bold transition-colors hover:text-[#ccff00] sm:text-base"
	>
		{entry.title}
	</a>
</div>

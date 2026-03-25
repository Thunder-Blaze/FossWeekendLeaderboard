<script lang="ts">
	import type { LeaderboardEntry } from '$lib/server/github';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let {
		data,
		startIndex = 4,
		searchTerm = ''
	} = $props<{ data: LeaderboardEntry[]; startIndex?: number; searchTerm?: string }>();

	let filteredData = $derived(
		data.filter((entry: LeaderboardEntry) =>
			entry.username.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);
</script>

<div
	class="w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
>
	<table class="w-full border-collapse text-left">
		<thead class="bg-black/40 text-xs tracking-wider text-gray-300 uppercase sm:text-sm">
			<tr>
				<th class="w-24 px-6 py-4 text-center font-semibold">Rank</th>
				<th class="px-6 py-4 font-semibold">Contributor</th>
				<th class="px-6 py-4 text-right font-semibold">Points</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-white/5">
			{#if filteredData.length === 0}
				<tr>
					<td colspan="3" class="px-6 py-8 text-center text-gray-400">
						No contributors found matching "{searchTerm}"
					</td>
				</tr>
			{:else}
				{#each filteredData as entry, idx (entry.username)}
					<tr
						animate:flip={{ duration: 300 }}
						transition:fade
						class="transition-colors duration-200 hover:bg-white/10"
					>
						<td class="px-6 py-4 text-center font-bold text-gray-400">
							{data.findIndex((e: LeaderboardEntry) => e.username === entry.username) + startIndex}
						</td>
						<td class="px-6 py-4">
							<a
								href={`https://github.com/${entry.username}`}
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-white transition-colors hover:text-indigo-400"
							>
								{entry.username}
							</a>
						</td>
						<td class="px-6 py-4 text-right font-bold text-indigo-300">
							{entry.score}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

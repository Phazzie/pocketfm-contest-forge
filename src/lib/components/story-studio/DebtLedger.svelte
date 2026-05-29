<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';
	import { bingeDebtLedgerOutputSchema } from '$lib/story-modules/modules/binge-debt-ledger/contract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
	const parsedOutput = $derived(
		artifact.result?.output ? bingeDebtLedgerOutputSchema.safeParse(artifact.result.output) : null
	);
</script>

{#if parsedOutput?.success}
	<ul class="debt-list">
		{#each parsedOutput.data.openedDebts as debt (debt.id)}
			<li>
				<strong>{debt.label}</strong>
				<span>{debt.payoffWindow}</span>
				<em>{debt.interest}</em>
			</li>
		{/each}
	</ul>
	<p>{parsedOutput.data.auditorNote}</p>
{/if}

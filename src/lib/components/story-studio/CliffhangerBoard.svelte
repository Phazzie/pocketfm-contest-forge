<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';
	import { cliffhangerFuturesOutputSchema } from '$lib/story-modules/modules/cliffhanger-futures/contract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
	const parsedOutput = $derived(
		artifact.result?.output
			? cliffhangerFuturesOutputSchema.safeParse(artifact.result.output)
			: null
	);
</script>

{#if parsedOutput?.success}
	<ul class="clean-list">
		{#each parsedOutput.data.candidates as candidate (candidate.id)}
			<li class:winner={candidate.id === parsedOutput.data.recommendationId}>
				<strong>{candidate.text}</strong>
				<span>{candidate.payoffPath}</span>
				<em>{candidate.payoffWarning}</em>
			</li>
		{/each}
	</ul>
	<p>{parsedOutput.data.marketRationale}</p>
{/if}

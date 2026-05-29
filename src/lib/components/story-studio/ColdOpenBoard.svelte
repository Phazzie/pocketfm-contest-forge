<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';
	import { coldOpenLabOutputSchema } from '$lib/story-modules/modules/cold-open-lab/contract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
	const parsedOutput = $derived(
		artifact.result?.output ? coldOpenLabOutputSchema.safeParse(artifact.result.output) : null
	);
</script>

{#if parsedOutput?.success}
	<ul class="clean-list live-variant-list">
		{#each parsedOutput.data.variants as variant (variant.id)}
			<li class:winner={variant.id === parsedOutput.data.winnerId}>
				<strong>{variant.text}</strong>
				<span>{variant.firstMinuteQuestion}</span>
				<em>{variant.audioNote}</em>
			</li>
		{/each}
	</ul>
	<p>{parsedOutput.data.winnerRationale}</p>
{/if}

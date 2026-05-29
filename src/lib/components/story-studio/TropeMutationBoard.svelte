<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';
	import { tropeMutationLabOutputSchema } from '$lib/story-modules/modules/trope-mutation-lab/contract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
	const parsedOutput = $derived(
		artifact.result?.output ? tropeMutationLabOutputSchema.safeParse(artifact.result.output) : null
	);
</script>

{#if parsedOutput?.success}
	<ul class="clean-list">
		<li><strong>Doorway</strong><span>{parsedOutput.data.expectedTrope}</span></li>
		<li><strong>Mutation</strong><span>{parsedOutput.data.mutationRule}</span></li>
		<li><strong>Engine</strong><span>{parsedOutput.data.serialEngine}</span></li>
		<li><strong>Scene proof</strong><span>{parsedOutput.data.sceneProof}</span></li>
	</ul>
{/if}

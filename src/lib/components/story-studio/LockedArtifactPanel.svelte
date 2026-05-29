<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
</script>

{#if artifact.nextAction}
	<div class="next-action">
		<strong>{artifact.nextAction.label}</strong>
		<span>{artifact.nextAction.reason}</span>
	</div>
{/if}

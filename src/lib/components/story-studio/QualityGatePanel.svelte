<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
</script>

{#if artifact.issues.length}
	<ul class="issue-list" aria-label={`${artifact.label} quality issues`}>
		{#each artifact.issues as issue (`${artifact.id}-${issue.code}-${issue.message}`)}
			<li>{issue.code}: {issue.message}</li>
		{/each}
	</ul>
{/if}

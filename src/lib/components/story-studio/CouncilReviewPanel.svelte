<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryStudioArtifact } from '$lib/core/contracts/storyStudioContract';
	import { councilReviewOutputSchema } from '$lib/story-modules/modules/council-review/contract';

	interface Props {
		artifact: StoryStudioArtifact;
	}

	let { artifact }: Props = $props();
	const parsedOutput = $derived(
		artifact.result?.output ? councilReviewOutputSchema.safeParse(artifact.result.output) : null
	);
</script>

{#if parsedOutput?.success}
	<div class="council-grid">
		{#each parsedOutput.data.roles as role (role.role)}
			<section>
				<span>{role.role}</span>
				<h4>{role.finding}</h4>
				<p>{role.revisionMove}</p>
				<em>{role.riskIfIgnored}</em>
			</section>
		{/each}
	</div>
	<div class="next-action">
		<strong>{parsedOutput.data.greenlight}</strong>
		<span>{parsedOutput.data.topRevisionMove}</span>
	</div>
{/if}

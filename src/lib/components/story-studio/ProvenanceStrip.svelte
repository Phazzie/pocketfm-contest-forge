<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type { StoryModulePlanProvenance } from '$lib/core/contracts/contestForgeContract';

	interface Props {
		provenance: StoryModulePlanProvenance;
	}

	let { provenance }: Props = $props();
</script>

<small class="provenance-strip">
	{provenance.provider} | {provenance.model} | {provenance.promptVersion} |
	{provenance.latencyMs}ms | repairs {provenance.repairAttempts ?? 0}
</small>

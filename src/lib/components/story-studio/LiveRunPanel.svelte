<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type {
		StoryStudioArtifact,
		StoryStudioResponse,
		StoryStudioRun
	} from '$lib/core/contracts/storyStudioContract';
	import ColdOpenBoard from './ColdOpenBoard.svelte';
	import DebtLedger from './DebtLedger.svelte';
	import CliffhangerBoard from './CliffhangerBoard.svelte';
	import TropeMutationBoard from './TropeMutationBoard.svelte';
	import CouncilReviewPanel from './CouncilReviewPanel.svelte';
	import LockedArtifactPanel from './LockedArtifactPanel.svelte';
	import ProvenanceStrip from './ProvenanceStrip.svelte';
	import QualityGatePanel from './QualityGatePanel.svelte';

	type StoryStudioError = Extract<StoryStudioResponse, { success: false }>['error'];

	interface Props {
		run: StoryStudioRun;
		workingTitle: string;
		logline: string;
		isLiveSubmitting: boolean;
		studioError?: StoryStudioError | null;
	}

	let { run, workingTitle, logline, isLiveSubmitting, studioError = null }: Props = $props();

	function dateLabel(value: string) {
		return value.slice(0, 10);
	}

	function artifactStatusClass(artifact: StoryStudioArtifact) {
		return `artifact ${artifact.status}`;
	}
</script>

<div class="story-studio output-rail">
	<section class="score-band">
		<div>
			<p class="eyebrow">Live artifacts</p>
			<h2>{run.qualitySummary.accepted}/{run.artifacts.length}</h2>
			<span class="mode-pill" class:busy={isLiveSubmitting}>
				{isLiveSubmitting ? 'running' : run.generationMode}
			</span>
		</div>

		<div class="score-stack" aria-label="Story Studio artifact status">
			<div class="metric accepted">
				<span>Accepted</span>
				<strong>{run.qualitySummary.accepted}</strong>
			</div>
			<div class="metric failed">
				<span>Failed</span>
				<strong>{run.qualitySummary.failed}</strong>
			</div>
			<div class="metric locked">
				<span>Locked</span>
				<strong>{run.qualitySummary.locked}</strong>
			</div>
			<div class="metric rejected">
				<span>Rejected</span>
				<strong>{run.qualitySummary.rejected}</strong>
			</div>
		</div>
	</section>

	{#if studioError}
		<section class="alert-band">
			<p>{studioError.message}</p>
			{#if studioError.issues?.length}
				<ul>
					{#each studioError.issues as issue (`studio-error-${issue.field ?? 'global'}-${issue.message}`)}
						<li>
							{#if issue.field}
								<strong>{issue.field}</strong>:
							{/if}
							{issue.message}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<section class="thesis-band">
		<p class="eyebrow">{run.brief.contestName}</p>
		<h2>{workingTitle}</h2>
		<p>{logline}</p>
		<div class="brief-strip">
			<span>{run.brief.formatSignal}</span>
			<span>{run.contestFreshness.status}</span>
			{#if run.contestFreshness.retrievedAt}
				<span>Retrieved {dateLabel(run.contestFreshness.retrievedAt)}</span>
			{/if}
			{#if run.contestFreshness.staleAfter}
				<span>Stale after {dateLabel(run.contestFreshness.staleAfter)}</span>
			{/if}
			{#if run.contestFreshness.warning}
				<span>{run.contestFreshness.warning}</span>
			{/if}
		</div>
	</section>

	<section class="visual-band" aria-label="Story Studio run order">
		<ol class="beat-list">
			{#each run.artifacts as artifact, index (artifact.id)}
				<li class={artifact.status}>
					<span>{index + 1}</span>
					<div>
						<strong>{artifact.label}</strong>
						<p>{artifact.summary}</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<section class="module-grid">
		{#each run.artifacts as artifact (artifact.id)}
			<article class={artifactStatusClass(artifact)}>
				<div class="module-header">
					<span>{artifact.status}</span>
					<h3>{artifact.label}</h3>
				</div>

				<p>{artifact.summary}</p>
				<LockedArtifactPanel {artifact} />

				{#if artifact.provenance}
					<ProvenanceStrip provenance={artifact.provenance} />
				{/if}

				<QualityGatePanel {artifact} />

				{#if artifact.result?.output}
					{#if artifact.id === 'cold-open-lab'}
						<ColdOpenBoard {artifact} />
					{:else if artifact.id === 'binge-debt-ledger'}
						<DebtLedger {artifact} />
					{:else if artifact.id === 'cliffhanger-futures'}
						<CliffhangerBoard {artifact} />
					{:else if artifact.id === 'trope-mutation-lab'}
						<TropeMutationBoard {artifact} />
					{:else if artifact.id === 'council-review'}
						<CouncilReviewPanel {artifact} />
					{/if}
				{/if}
			</article>
		{/each}
	</section>

	<section class="grid three">
		<div class="panel">
			<p class="eyebrow">Contest signals</p>
			<ul class="clean-list">
				{#each run.brief.judgingSignals as signal (signal)}
					<li>{signal}</li>
				{/each}
			</ul>
		</div>

		<div class="panel">
			<p class="eyebrow">Mandatory elements</p>
			<ul class="clean-list">
				{#each run.brief.mandatoryElements as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>

		<div class="panel">
			<p class="eyebrow">Prompt pressure</p>
			<p>{run.brief.promptPressure}</p>
		</div>
	</section>
</div>

<style>
	.output-rail {
		display: grid;
		gap: 18px;
		padding: 24px;
	}

	:global(.story-studio h2),
	:global(.story-studio h3),
	:global(.story-studio h4),
	:global(.story-studio p) {
		margin-top: 0;
	}

	:global(.story-studio h2) {
		margin-bottom: 10px;
		font-size: 28px;
		line-height: 1.08;
	}

	:global(.story-studio h3) {
		margin-bottom: 0;
		font-size: 18px;
		line-height: 1.15;
	}

	:global(.story-studio h4) {
		margin-bottom: 0;
		font-size: 15px;
		line-height: 1.25;
	}

	:global(.story-studio .eyebrow) {
		margin: 0 0 8px;
		color: #0f8f83;
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	:global(.story-studio .score-band),
	:global(.story-studio .thesis-band),
	:global(.story-studio .visual-band),
	:global(.story-studio .alert-band),
	:global(.story-studio .panel),
	:global(.story-studio .artifact) {
		background: rgba(255, 255, 255, 0.78);
		border: 1px solid rgba(25, 23, 19, 0.12);
		border-radius: 8px;
		box-shadow: 0 12px 30px rgba(25, 23, 19, 0.06);
	}

	:global(.story-studio .score-band) {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 20px;
		align-items: center;
		padding: 20px;
	}

	:global(.story-studio .score-band h2) {
		margin: 0;
		color: #e9543f;
		font-size: 54px;
		line-height: 0.9;
	}

	:global(.story-studio .mode-pill) {
		display: inline-flex;
		margin-top: 10px;
		padding: 5px 8px;
		border-radius: 999px;
		background: rgba(15, 143, 131, 0.12);
		color: #0f8f83;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	:global(.story-studio .mode-pill.busy) {
		background: rgba(216, 155, 39, 0.18);
		color: #6f3c7b;
	}

	:global(.story-studio .score-stack) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	:global(.story-studio .metric) {
		display: grid;
		gap: 6px;
		min-height: 74px;
		align-content: center;
		padding: 12px;
		border: 1px solid #e7e0d2;
		background: #fff8ea;
	}

	:global(.story-studio .metric span) {
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	:global(.story-studio .metric strong) {
		font-size: 26px;
	}

	:global(.story-studio .metric.accepted) {
		border-color: rgba(15, 143, 131, 0.35);
	}

	:global(.story-studio .metric.failed),
	:global(.story-studio .metric.rejected) {
		border-color: rgba(233, 84, 63, 0.35);
	}

	:global(.story-studio .metric.locked) {
		border-color: rgba(216, 155, 39, 0.42);
	}

	:global(.story-studio .alert-band) {
		padding: 14px 16px;
		border-color: rgba(233, 84, 63, 0.42);
		background: #fff2ee;
		color: #6f3c7b;
	}

	:global(.story-studio .alert-band p:last-child),
	:global(.story-studio .panel p:last-child),
	:global(.story-studio .thesis-band p:last-child) {
		margin-bottom: 0;
	}

	:global(.story-studio .thesis-band),
	:global(.story-studio .visual-band),
	:global(.story-studio .panel),
	:global(.story-studio .artifact) {
		padding: 18px;
	}

	:global(.story-studio .thesis-band p) {
		max-width: 980px;
		color: #504a43;
		font-size: 16px;
	}

	:global(.story-studio .brief-strip) {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}

	:global(.story-studio .brief-strip span),
	:global(.story-studio .next-action strong),
	:global(.story-studio .module-header span),
	:global(.story-studio .provenance-strip) {
		color: #2f6fbb;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	:global(.story-studio .brief-strip span) {
		padding: 5px 8px;
		border: 1px solid rgba(47, 111, 187, 0.18);
		background: rgba(47, 111, 187, 0.08);
	}

	:global(.story-studio .visual-band) {
		background: #221f1d;
		color: #fff8ea;
	}

	:global(.story-studio .grid),
	:global(.story-studio .module-grid),
	:global(.story-studio .council-grid),
	:global(.story-studio .beat-list),
	:global(.story-studio .clean-list),
	:global(.story-studio .debt-list),
	:global(.story-studio .issue-list) {
		display: grid;
		gap: 14px;
	}

	:global(.story-studio .three) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	:global(.story-studio .module-grid) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.story-studio .council-grid) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.story-studio .beat-list),
	:global(.story-studio .clean-list),
	:global(.story-studio .debt-list),
	:global(.story-studio .issue-list) {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	:global(.story-studio .beat-list li) {
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: 12px;
	}

	:global(.story-studio .beat-list li > span) {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		background: #2f6fbb;
		color: #fff;
		font-weight: 900;
	}

	:global(.story-studio .beat-list li.accepted > span) {
		background: #0f8f83;
	}

	:global(.story-studio .beat-list li.failed > span),
	:global(.story-studio .beat-list li.rejected > span) {
		background: #e9543f;
	}

	:global(.story-studio .beat-list li.locked > span) {
		background: #d89b27;
	}

	:global(.story-studio .beat-list p),
	:global(.story-studio .clean-list span),
	:global(.story-studio .clean-list em),
	:global(.story-studio .debt-list span),
	:global(.story-studio .debt-list em) {
		display: block;
		margin: 3px 0 0;
		color: #504a43;
		font-style: normal;
	}

	:global(.story-studio .visual-band .beat-list p) {
		color: rgba(255, 248, 234, 0.74);
	}

	:global(.story-studio .clean-list li),
	:global(.story-studio .debt-list li) {
		padding-left: 12px;
		border-left: 3px solid #d89b27;
		color: #504a43;
	}

	:global(.story-studio .clean-list li.winner) {
		border-color: #0f8f83;
		background: rgba(15, 143, 131, 0.06);
	}

	:global(.story-studio .debt-list li) {
		border-color: #e9543f;
	}

	:global(.story-studio .artifact) {
		display: grid;
		gap: 12px;
		align-content: start;
	}

	:global(.story-studio .artifact.accepted) {
		border-color: rgba(15, 143, 131, 0.36);
	}

	:global(.story-studio .artifact.failed),
	:global(.story-studio .artifact.rejected) {
		border-color: rgba(233, 84, 63, 0.44);
		background: #fff2ee;
	}

	:global(.story-studio .artifact.locked) {
		border-color: rgba(216, 155, 39, 0.42);
		background: rgba(242, 227, 191, 0.5);
	}

	:global(.story-studio .module-header) {
		display: grid;
		gap: 5px;
	}

	:global(.story-studio .artifact p),
	:global(.story-studio .artifact li),
	:global(.story-studio .panel li),
	:global(.story-studio .panel p),
	:global(.story-studio .council-grid p),
	:global(.story-studio .council-grid em) {
		color: #504a43;
		font-size: 14px;
		line-height: 1.45;
	}

	:global(.story-studio .next-action) {
		display: grid;
		gap: 4px;
		padding: 10px;
		border: 1px solid rgba(216, 155, 39, 0.35);
		background: rgba(216, 155, 39, 0.1);
	}

	:global(.story-studio .next-action span) {
		color: #504a43;
		font-size: 14px;
	}

	:global(.story-studio .issue-list) {
		padding-left: 18px;
		color: #6f3c7b;
		list-style: disc;
	}

	:global(.story-studio .council-grid section) {
		display: grid;
		gap: 8px;
		padding: 12px;
		border: 1px solid rgba(15, 143, 131, 0.2);
		background: rgba(15, 143, 131, 0.06);
	}

	:global(.story-studio .council-grid span),
	:global(.story-studio .council-grid em) {
		color: #6f3c7b;
		font-size: 12px;
		font-style: normal;
		font-weight: 900;
		text-transform: uppercase;
	}

	@media (max-width: 1040px) {
		.output-rail {
			padding: 24px;
		}

		:global(.story-studio .score-band),
		:global(.story-studio .three),
		:global(.story-studio .module-grid),
		:global(.story-studio .council-grid) {
			grid-template-columns: 1fr;
		}

		:global(.story-studio .score-stack) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.output-rail {
			padding: 16px;
		}

		:global(.story-studio .score-stack) {
			grid-template-columns: 1fr;
		}

		:global(.story-studio .score-band h2) {
			font-size: 44px;
		}
	}
</style>

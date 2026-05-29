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

	const statusRows = $derived([
		{ label: 'Accepted', value: run.qualitySummary.accepted, tone: 'accepted' },
		{ label: 'Failed', value: run.qualitySummary.failed, tone: 'failed' },
		{ label: 'Rejected', value: run.qualitySummary.rejected, tone: 'rejected' },
		{ label: 'Locked', value: run.qualitySummary.locked, tone: 'locked' },
		{ label: 'Running', value: run.qualitySummary.running, tone: 'running' },
		{ label: 'Stale', value: run.qualitySummary.stale, tone: 'stale' }
	]);
	const recentTrackingEvents = $derived(run.trackingEvents.slice(-4).reverse());
	const provenanceArtifacts = $derived(run.artifacts.filter((artifact) => artifact.provenance));

	function dateLabel(value: string) {
		return value.slice(0, 10);
	}

	function formatStatus(status: StoryStudioArtifact['status']) {
		return status.replace('-', ' ');
	}

	function qualityGateMessage(artifact: StoryStudioArtifact) {
		if (artifact.issues.length > 0) {
			return artifact.issues[0]?.message ?? artifact.summary;
		}

		if (artifact.nextAction) {
			return artifact.nextAction.reason;
		}

		if (artifact.provenance) {
			return `${artifact.provenance.provider} accepted ${artifact.provenance.promptVersion}.`;
		}

		return artifact.summary;
	}
</script>

<div class="story-studio output-rail">
	{#if studioError}
		<section class="alert-band" role="alert">
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
		<div class="thesis-copy">
			<p class="eyebrow">{run.brief.contestName}</p>
			<h2>{workingTitle || 'Untitled story'}</h2>
			<p>{logline}</p>
		</div>

		<div class="freshness-panel" class:stale={run.contestFreshness.status === 'stale'}>
			<span>{run.contestFreshness.status}</span>
			<strong>{run.brief.formatSignal}</strong>
			{#if run.contestFreshness.retrievedAt}
				<small>Retrieved {dateLabel(run.contestFreshness.retrievedAt)}</small>
			{/if}
			{#if run.contestFreshness.staleAfter}
				<small>Stale after {dateLabel(run.contestFreshness.staleAfter)}</small>
			{/if}
			{#if run.contestFreshness.warning}
				<em>{run.contestFreshness.warning}</em>
			{/if}
		</div>
	</section>

	<div class="studio-layout">
		<div class="board-column">
			<section class="visual-band" aria-label="Story Studio run order">
				<div class="section-heading">
					<div>
						<p class="eyebrow">Artifact runway</p>
						<h2>Live module order</h2>
					</div>
					<span class="mode-pill" class:busy={isLiveSubmitting}>
						{isLiveSubmitting ? 'running' : run.generationMode}
					</span>
				</div>

				<ol class="beat-list">
					{#each run.artifacts as artifact, index (artifact.id)}
						<li class="runway-step {artifact.status}">
							<span>{index + 1}</span>
							<div>
								<strong>{artifact.label}</strong>
								<small>{formatStatus(artifact.status)}</small>
								<p>{artifact.summary}</p>
							</div>
						</li>
					{/each}
				</ol>
			</section>

			<section class="module-grid" aria-label="Story artifacts">
				{#each run.artifacts as artifact (artifact.id)}
					<article class="artifact {artifact.status}" data-artifact={artifact.id}>
						<div class="module-header">
							<span class="status-stamp {artifact.status}">{formatStatus(artifact.status)}</span>
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

			<section class="research-band" aria-label="Contest research">
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

				<div class="panel pressure-panel">
					<p class="eyebrow">Prompt pressure</p>
					<p>{run.brief.promptPressure}</p>
				</div>
			</section>
		</div>

		<aside class="judge-rail" aria-label="Quality and provenance">
			<section class="judge-card score-band">
				<div class="judge-heading">
					<div>
						<p class="eyebrow">Gate count</p>
						<h2>{run.qualitySummary.accepted}/{run.artifacts.length}</h2>
					</div>
					<span class="mode-pill" class:busy={isLiveSubmitting}>
						{isLiveSubmitting ? 'running' : run.mode}
					</span>
				</div>

				<div class="score-stack" aria-label="Story Studio artifact status">
					{#each statusRows as row (row.label)}
						<div class="metric {row.tone}">
							<span>{row.label}</span>
							<strong>{row.value}</strong>
						</div>
					{/each}
				</div>
			</section>

			<section class="judge-card gate-list">
				<p class="eyebrow">Quality gates</p>
				<ul>
					{#each run.artifacts as artifact (artifact.id)}
						<li class={artifact.status}>
							<span class="status-stamp {artifact.status}">{formatStatus(artifact.status)}</span>
							<div>
								<strong>{artifact.label}</strong>
								<p>{qualityGateMessage(artifact)}</p>
							</div>
						</li>
					{/each}
				</ul>
			</section>

			{#if provenanceArtifacts.length}
				<section class="judge-card provenance-ledger">
					<p class="eyebrow">Provider trail</p>
					<ul>
						{#each provenanceArtifacts as artifact (artifact.id)}
							{#if artifact.provenance}
								<li>
									<strong>{artifact.label}</strong>
									<span>{artifact.provenance.provider} / {artifact.provenance.model}</span>
									<em>{artifact.provenance.promptVersion} | {artifact.provenance.latencyMs}ms</em>
								</li>
							{/if}
						{/each}
					</ul>
				</section>
			{/if}

			{#if recentTrackingEvents.length}
				<section class="judge-card event-strip">
					<p class="eyebrow">Recent tracking</p>
					<ul>
						{#each recentTrackingEvents as event (`${event.type}-${event.moduleId}-${event.subjectId}-${event.summary}`)}
							<li>
								<strong>{event.moduleId}</strong>
								<span>{event.summary}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</aside>
	</div>
</div>

<style>
	.output-rail {
		display: grid;
		gap: 20px;
		align-content: start;
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

	.alert-band,
	.thesis-band,
	.visual-band,
	.judge-card,
	.panel,
	.artifact {
		border: 1px solid rgba(25, 23, 19, 0.12);
		border-radius: 8px;
		box-shadow: 0 12px 30px rgba(25, 23, 19, 0.06);
	}

	.alert-band {
		padding: 14px 16px;
		border-color: rgba(233, 84, 63, 0.42);
		background: #fff2ee;
		color: #6f3c7b;
	}

	.alert-band p:last-child,
	.panel p:last-child,
	.thesis-band p:last-child,
	.artifact p:last-child {
		margin-bottom: 0;
	}

	.thesis-band {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(220px, 330px);
		gap: 20px;
		align-items: end;
		padding: 24px;
		border-left: 8px solid #e9543f;
		background: #191713;
		color: #fff8ea;
	}

	.thesis-band .eyebrow {
		color: #8bd8cf;
	}

	.thesis-copy p {
		max-width: 980px;
		color: rgba(255, 248, 234, 0.78);
		font-size: 16px;
		line-height: 1.55;
	}

	.freshness-panel {
		display: grid;
		gap: 8px;
		align-content: start;
		padding: 14px;
		background: rgba(255, 248, 234, 0.08);
		border: 1px solid rgba(255, 248, 234, 0.18);
		color: #fff8ea;
	}

	.freshness-panel.stale {
		border-color: rgba(233, 84, 63, 0.5);
		background: rgba(233, 84, 63, 0.14);
	}

	.freshness-panel span,
	.freshness-panel small,
	.freshness-panel em {
		font-size: 12px;
		line-height: 1.35;
	}

	.freshness-panel span,
	.freshness-panel small {
		font-weight: 900;
		text-transform: uppercase;
	}

	.freshness-panel strong {
		font-size: 14px;
		line-height: 1.35;
	}

	.freshness-panel em {
		color: #f2e3bf;
		font-style: normal;
	}

	.studio-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 350px);
		gap: 20px;
		align-items: start;
	}

	.board-column,
	.judge-rail {
		display: grid;
		gap: 18px;
		min-width: 0;
	}

	.judge-rail {
		position: sticky;
		top: 24px;
		align-self: start;
	}

	.visual-band {
		padding: 18px;
		background: #221f1d;
		color: #fff8ea;
	}

	.visual-band .eyebrow,
	.judge-card .eyebrow {
		color: #d89b27;
	}

	.section-heading,
	.judge-heading {
		display: flex;
		gap: 14px;
		align-items: start;
		justify-content: space-between;
	}

	.mode-pill {
		display: inline-flex;
		flex: 0 0 auto;
		margin-top: 2px;
		padding: 6px 8px;
		border-radius: 999px;
		background: rgba(15, 143, 131, 0.14);
		color: #0f8f83;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	.visual-band .mode-pill {
		background: rgba(139, 216, 207, 0.14);
		color: #8bd8cf;
	}

	.mode-pill.busy {
		background: rgba(216, 155, 39, 0.18);
		color: #6f3c7b;
	}

	.beat-list,
	.research-band,
	.module-grid,
	.score-stack,
	.gate-list ul,
	.provenance-ledger ul,
	.event-strip ul,
	:global(.story-studio .council-grid),
	:global(.story-studio .clean-list),
	:global(.story-studio .debt-list),
	:global(.story-studio .issue-list) {
		display: grid;
		gap: 14px;
	}

	.beat-list,
	.gate-list ul,
	.provenance-ledger ul,
	.event-strip ul,
	:global(.story-studio .clean-list),
	:global(.story-studio .debt-list),
	:global(.story-studio .issue-list) {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.beat-list {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}

	.runway-step {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 10px;
		min-height: 180px;
		padding: 12px;
		border: 1px solid rgba(255, 248, 234, 0.14);
		background: rgba(255, 248, 234, 0.06);
	}

	.runway-step > span {
		display: grid;
		width: 38px;
		height: 38px;
		place-items: center;
		background: #2f6fbb;
		color: #fff;
		font-weight: 900;
	}

	.runway-step.accepted > span {
		background: #0f8f83;
	}

	.runway-step.failed > span,
	.runway-step.rejected > span {
		background: #e9543f;
	}

	.runway-step.locked > span,
	.runway-step.stale > span {
		background: #d89b27;
	}

	.runway-step.running > span {
		background: #6f3c7b;
	}

	.runway-step strong,
	.runway-step small {
		display: block;
	}

	.runway-step small {
		margin: 5px 0 8px;
		color: #8bd8cf;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	.runway-step p {
		margin-bottom: 0;
		color: rgba(255, 248, 234, 0.74);
		font-size: 13px;
		line-height: 1.42;
	}

	.module-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.artifact {
		display: grid;
		gap: 12px;
		align-content: start;
		min-width: 0;
		padding: 18px;
		background: rgba(255, 255, 255, 0.78);
	}

	.artifact[data-artifact='cold-open-lab'],
	.artifact[data-artifact='council-review'] {
		grid-column: 1 / -1;
	}

	.artifact.accepted {
		border-color: rgba(15, 143, 131, 0.36);
	}

	.artifact.failed,
	.artifact.rejected {
		border-color: rgba(233, 84, 63, 0.44);
		background: #fff2ee;
	}

	.artifact.locked,
	.artifact.stale {
		border-color: rgba(216, 155, 39, 0.42);
		background: rgba(242, 227, 191, 0.5);
	}

	.module-header {
		display: flex;
		gap: 10px;
		align-items: start;
		justify-content: space-between;
	}

	.status-stamp,
	:global(.story-studio .brief-strip span),
	:global(.story-studio .next-action strong),
	:global(.story-studio .provenance-strip) {
		color: #2f6fbb;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	.status-stamp {
		flex: 0 0 auto;
		padding: 5px 8px;
		border: 1px solid rgba(47, 111, 187, 0.18);
		background: rgba(47, 111, 187, 0.08);
	}

	.status-stamp.accepted {
		border-color: rgba(15, 143, 131, 0.28);
		background: rgba(15, 143, 131, 0.1);
		color: #0f8f83;
	}

	.status-stamp.failed,
	.status-stamp.rejected {
		border-color: rgba(233, 84, 63, 0.3);
		background: rgba(233, 84, 63, 0.1);
		color: #e9543f;
	}

	.status-stamp.locked,
	.status-stamp.stale {
		border-color: rgba(216, 155, 39, 0.4);
		background: rgba(216, 155, 39, 0.13);
		color: #7b5a10;
	}

	.status-stamp.running {
		border-color: rgba(111, 60, 123, 0.32);
		background: rgba(111, 60, 123, 0.1);
		color: #6f3c7b;
	}

	.artifact p,
	.panel p,
	.panel li,
	:global(.story-studio .artifact li),
	:global(.story-studio .council-grid p),
	:global(.story-studio .council-grid em) {
		color: #504a43;
		font-size: 14px;
		line-height: 1.45;
	}

	.research-band {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.panel,
	.judge-card {
		padding: 16px;
		background: rgba(255, 255, 255, 0.78);
	}

	.pressure-panel {
		border-left: 5px solid #6f3c7b;
	}

	.score-band h2 {
		margin: 0;
		color: #e9543f;
		font-size: 48px;
		line-height: 0.9;
	}

	.score-stack {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.metric {
		display: grid;
		gap: 6px;
		min-height: 76px;
		align-content: center;
		padding: 12px;
		border: 1px solid #e7e0d2;
		background: #fff8ea;
	}

	.metric span {
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	.metric strong {
		font-size: 26px;
	}

	.metric.accepted {
		border-color: rgba(15, 143, 131, 0.35);
	}

	.metric.failed,
	.metric.rejected {
		border-color: rgba(233, 84, 63, 0.35);
	}

	.metric.locked,
	.metric.stale {
		border-color: rgba(216, 155, 39, 0.42);
	}

	.metric.running {
		border-color: rgba(111, 60, 123, 0.3);
	}

	.gate-list li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 10px;
		align-items: start;
		padding: 10px 0;
		border-top: 1px solid rgba(25, 23, 19, 0.1);
	}

	.gate-list li:first-child {
		border-top: 0;
	}

	.gate-list strong,
	.provenance-ledger strong,
	.event-strip strong {
		display: block;
		color: #191713;
		font-size: 13px;
		line-height: 1.3;
	}

	.gate-list p,
	.provenance-ledger span,
	.provenance-ledger em,
	.event-strip span {
		display: block;
		margin: 3px 0 0;
		color: #504a43;
		font-size: 12px;
		line-height: 1.38;
	}

	.provenance-ledger li,
	.event-strip li {
		padding-left: 10px;
		border-left: 3px solid #2f6fbb;
	}

	.provenance-ledger em {
		color: #2f6fbb;
		font-style: normal;
		font-weight: 800;
	}

	.event-strip li {
		border-color: #0f8f83;
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

	:global(.story-studio .clean-list span),
	:global(.story-studio .clean-list em),
	:global(.story-studio .debt-list span),
	:global(.story-studio .debt-list em) {
		display: block;
		margin: 3px 0 0;
		color: #504a43;
		font-style: normal;
	}

	:global(.story-studio .debt-list li) {
		border-color: #e9543f;
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

	:global(.story-studio .council-grid) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
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

	@media (max-width: 1180px) {
		.studio-layout {
			grid-template-columns: 1fr;
		}

		.judge-rail {
			position: relative;
			top: auto;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.gate-list,
		.provenance-ledger,
		.event-strip {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 1040px) {
		.output-rail {
			padding: 24px;
		}

		.thesis-band,
		.research-band,
		.module-grid,
		:global(.story-studio .council-grid) {
			grid-template-columns: 1fr;
		}

		.artifact[data-artifact='cold-open-lab'],
		.artifact[data-artifact='council-review'] {
			grid-column: auto;
		}
	}

	@media (max-width: 760px) {
		.beat-list,
		.judge-rail,
		.score-stack {
			grid-template-columns: 1fr;
		}

		.section-heading,
		.judge-heading,
		.module-header {
			display: grid;
		}
	}

	@media (max-width: 620px) {
		.output-rail {
			padding: 16px;
		}

		.thesis-band,
		.visual-band,
		.panel,
		.judge-card,
		.artifact {
			padding: 14px;
		}

		.score-band h2 {
			font-size: 44px;
		}
	}
</style>

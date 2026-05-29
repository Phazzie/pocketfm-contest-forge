<script lang="ts">
	import type {
		ContestGenre,
		ForgeRequest,
		MechanismId,
		RiskTolerance
	} from '$lib/core/contracts/contestForgeContract';
	import type {
		StoryStudioArtifact,
		StoryStudioResponse
	} from '$lib/core/contracts/storyStudioContract';
	import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
	import { bingeDebtLedgerOutputSchema } from '$lib/story-modules/modules/binge-debt-ledger/contract';
	import { cliffhangerFuturesOutputSchema } from '$lib/story-modules/modules/cliffhanger-futures/contract';
	import { coldOpenLabOutputSchema } from '$lib/story-modules/modules/cold-open-lab/contract';
	import { councilReviewOutputSchema } from '$lib/story-modules/modules/council-review/contract';
	import { tropeMutationLabOutputSchema } from '$lib/story-modules/modules/trope-mutation-lab/contract';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const defaultRequest = defaultForgeRequest;
	let selectedGenre = $state<ContestGenre>(defaultRequest.contestId);
	let workingTitle = $state(defaultRequest.seed.workingTitle);
	let protagonistName = $state(defaultRequest.seed.protagonistName);
	let logline = $state(defaultRequest.seed.logline);
	let emotionalPromise = $state(defaultRequest.seed.emotionalPromise);
	let tabooLever = $state(defaultRequest.seed.tabooLever);
	let episodeCountTarget = $state(defaultRequest.seed.episodeCountTarget);
	let minutesPerEpisode = $state(defaultRequest.seed.minutesPerEpisode);
	let riskLevel = $state<number>(defaultRequest.riskTolerance);
	let selectedMechanisms = $state<MechanismId[]>([...defaultRequest.selectedMechanisms]);
	let liveAccessCode = $state('');
	let isLiveSubmitting = $state(false);

	const request = $derived<ForgeRequest>({
		...defaultRequest,
		contestId: selectedGenre,
		riskTolerance: Math.round(riskLevel) as RiskTolerance,
		selectedMechanisms,
		seed: {
			...defaultRequest.seed,
			workingTitle,
			protagonistName,
			logline,
			genre: selectedGenre,
			emotionalPromise,
			tabooLever,
			episodeCountTarget: Number(episodeCountTarget),
			minutesPerEpisode: Number(minutesPerEpisode)
		}
	});

	$effect(() => {
		if (form?.submittedRequest) {
			syncRequest(form.submittedRequest);
			isLiveSubmitting = false;
		}
	});

	const storyStudio = $derived<StoryStudioResponse | null>(
		form?.submittedRequest && requestsMatch(request, form.submittedRequest)
			? (form.storyStudio ?? null)
			: null
	);
	const studioRun = $derived(storyStudio?.success ? storyStudio.data : data.initialStudioRun);
	const studioError = $derived(storyStudio && !storyStudio.success ? storyStudio.error : null);

	function toggleMechanism(id: MechanismId) {
		selectedMechanisms = selectedMechanisms.includes(id)
			? selectedMechanisms.filter((mechanism) => mechanism !== id)
			: [...selectedMechanisms, id];
	}

	function markLiveSubmit() {
		isLiveSubmitting = true;
	}

	function syncRequest(nextRequest: ForgeRequest) {
		selectedGenre = nextRequest.contestId;
		workingTitle = nextRequest.seed.workingTitle;
		protagonistName = nextRequest.seed.protagonistName;
		logline = nextRequest.seed.logline;
		emotionalPromise = nextRequest.seed.emotionalPromise;
		tabooLever = nextRequest.seed.tabooLever;
		episodeCountTarget = nextRequest.seed.episodeCountTarget;
		minutesPerEpisode = nextRequest.seed.minutesPerEpisode;
		riskLevel = nextRequest.riskTolerance;
		selectedMechanisms = [...nextRequest.selectedMechanisms];
	}

	function requestsMatch(currentRequest: ForgeRequest, submittedRequest: ForgeRequest) {
		return (
			currentRequest.contestId === submittedRequest.contestId &&
			currentRequest.riskTolerance === submittedRequest.riskTolerance &&
			currentRequest.seed.workingTitle === submittedRequest.seed.workingTitle &&
			currentRequest.seed.protagonistName === submittedRequest.seed.protagonistName &&
			currentRequest.seed.logline === submittedRequest.seed.logline &&
			currentRequest.seed.emotionalPromise === submittedRequest.seed.emotionalPromise &&
			currentRequest.seed.tabooLever === submittedRequest.seed.tabooLever &&
			currentRequest.seed.episodeCountTarget === submittedRequest.seed.episodeCountTarget &&
			currentRequest.seed.minutesPerEpisode === submittedRequest.seed.minutesPerEpisode &&
			mechanismsMatch(currentRequest.selectedMechanisms, submittedRequest.selectedMechanisms)
		);
	}

	function mechanismsMatch(currentMechanisms: MechanismId[], submittedMechanisms: MechanismId[]) {
		return (
			currentMechanisms.length === submittedMechanisms.length &&
			currentMechanisms.every((mechanism, index) => mechanism === submittedMechanisms[index])
		);
	}

	function artifactStatusClass(artifact: StoryStudioArtifact) {
		return `artifact ${artifact.status}`;
	}
</script>

<main class="app-shell">
	<section class="workbench">
		<form class="control-rail" method="POST" action="?/runLiveStudio" onsubmit={markLiveSubmit}>
			<div class="brand-lockup">
				<div class="mark">PF</div>
				<div>
					<p class="eyebrow">Serial Story Studio</p>
					<h1>Pocket FM Contest Forge</h1>
				</div>
			</div>

			<label>
				<span>Contest lane</span>
				<select name="contestId" bind:value={selectedGenre}>
					{#each data.briefs as brief (brief.id)}
						<option value={brief.id}>{brief.contestName}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Working title</span>
				<input name="workingTitle" bind:value={workingTitle} />
			</label>

			<label>
				<span>Protagonist</span>
				<input name="protagonistName" bind:value={protagonistName} />
			</label>

			<label>
				<span>Logline</span>
				<textarea name="logline" rows="5" bind:value={logline}></textarea>
			</label>

			<label>
				<span>Emotional promise</span>
				<input name="emotionalPromise" bind:value={emotionalPromise} />
			</label>

			<label>
				<span>Taboo lever</span>
				<input name="tabooLever" bind:value={tabooLever} />
			</label>

			<div class="number-grid">
				<label>
					<span>Episodes</span>
					<input
						name="episodeCountTarget"
						type="number"
						min="30"
						max="300"
						bind:value={episodeCountTarget}
					/>
				</label>

				<label>
					<span>Minutes</span>
					<input
						name="minutesPerEpisode"
						type="number"
						min="5"
						max="15"
						bind:value={minutesPerEpisode}
					/>
				</label>
			</div>

			<label>
				<span>Risk tolerance {Math.round(riskLevel)}</span>
				<input name="riskTolerance" type="range" min="1" max="5" step="1" bind:value={riskLevel} />
			</label>

			<div class="mechanism-picker">
				<p>Mechanisms</p>
				{#each data.mechanisms as mechanism (mechanism.id)}
					<button
						type="button"
						class:active={selectedMechanisms.includes(mechanism.id)}
						aria-pressed={selectedMechanisms.includes(mechanism.id)}
						onclick={() => toggleMechanism(mechanism.id)}
					>
						<span>{mechanism.shortLabel}</span>
					</button>
				{/each}
			</div>

			{#each selectedMechanisms as mechanism (mechanism)}
				<input type="hidden" name="selectedMechanisms" value={mechanism} />
			{/each}

			<div class="live-action">
				<label>
					<span>Live access code</span>
					<input
						type="password"
						name="accessCode"
						autocomplete="one-time-code"
						bind:value={liveAccessCode}
					/>
				</label>

				<button type="submit" disabled={isLiveSubmitting}>
					{isLiveSubmitting ? 'Running Story Studio' : 'Run Story Studio'}
				</button>
			</div>
		</form>

		<div class="output-rail">
			<section class="score-band">
				<div>
					<p class="eyebrow">Live artifacts</p>
					<h2>{studioRun.qualitySummary.accepted}/{studioRun.artifacts.length}</h2>
					<span class="mode-pill" class:busy={isLiveSubmitting}>
						{isLiveSubmitting ? 'running' : studioRun.generationMode}
					</span>
				</div>

				<div class="score-stack" aria-label="Story Studio artifact status">
					<div class="metric accepted">
						<span>Accepted</span>
						<strong>{studioRun.qualitySummary.accepted}</strong>
					</div>
					<div class="metric failed">
						<span>Failed</span>
						<strong>{studioRun.qualitySummary.failed}</strong>
					</div>
					<div class="metric locked">
						<span>Locked</span>
						<strong>{studioRun.qualitySummary.locked}</strong>
					</div>
					<div class="metric rejected">
						<span>Rejected</span>
						<strong>{studioRun.qualitySummary.rejected}</strong>
					</div>
				</div>
			</section>

			{#if studioError}
				<section class="alert-band">
					<p>{studioError.message}</p>
					{#if studioError.issues?.length}
						<ul>
							{#each studioError.issues as issue (`studio-error-${issue.field}-${issue.message}`)}
								<li>{issue.field}: {issue.message}</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/if}

			<section class="thesis-band">
				<p class="eyebrow">{studioRun.brief.contestName}</p>
				<h2>{workingTitle}</h2>
				<p>{logline}</p>
				<div class="brief-strip">
					<span>{studioRun.brief.formatSignal}</span>
					<span>{studioRun.contestFreshness.status}</span>
					{#if studioRun.contestFreshness.retrievedAt}
						<span
							>Retrieved {new Date(
								studioRun.contestFreshness.retrievedAt
							).toLocaleDateString()}</span
						>
					{/if}
					{#if studioRun.contestFreshness.staleAfter}
						<span
							>Stale after {new Date(
								studioRun.contestFreshness.staleAfter
							).toLocaleDateString()}</span
						>
					{/if}
					{#if studioRun.contestFreshness.warning}
						<span>{studioRun.contestFreshness.warning}</span>
					{/if}
				</div>
			</section>

			<section class="visual-band" aria-label="Story Studio run order">
				<ol class="beat-list">
					{#each studioRun.artifacts as artifact, index (artifact.id)}
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
				{#each studioRun.artifacts as artifact (artifact.id)}
					<article class={artifactStatusClass(artifact)}>
						<div class="module-header">
							<span>{artifact.status}</span>
							<h3>{artifact.label}</h3>
						</div>

						<p>{artifact.summary}</p>

						{#if artifact.nextAction}
							<div class="next-action">
								<strong>{artifact.nextAction.label}</strong>
								<span>{artifact.nextAction.reason}</span>
							</div>
						{/if}

						{#if artifact.provenance}
							<small>
								{artifact.provenance.provider} · {artifact.provenance.model} ·
								{artifact.provenance.promptVersion} · {artifact.provenance.latencyMs}ms · repairs
								{artifact.provenance.repairAttempts ?? 0}
							</small>
						{/if}

						{#if artifact.issues.length}
							<ul class="issue-list">
								{#each artifact.issues as issue (`${artifact.id}-${issue.code}-${issue.message}`)}
									<li>{issue.code}: {issue.message}</li>
								{/each}
							</ul>
						{/if}

						{#if artifact.result?.output}
							{#if artifact.id === 'cold-open-lab'}
								{@const parsedOutput = coldOpenLabOutputSchema.safeParse(artifact.result.output)}
								{#if parsedOutput.success}
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
							{:else if artifact.id === 'binge-debt-ledger'}
								{@const parsedOutput = bingeDebtLedgerOutputSchema.safeParse(
									artifact.result.output
								)}
								{#if parsedOutput.success}
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
							{:else if artifact.id === 'cliffhanger-futures'}
								{@const parsedOutput = cliffhangerFuturesOutputSchema.safeParse(
									artifact.result.output
								)}
								{#if parsedOutput.success}
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
							{:else if artifact.id === 'trope-mutation-lab'}
								{@const parsedOutput = tropeMutationLabOutputSchema.safeParse(
									artifact.result.output
								)}
								{#if parsedOutput.success}
									<ul class="clean-list">
										<li><strong>Doorway</strong><span>{parsedOutput.data.expectedTrope}</span></li>
										<li><strong>Mutation</strong><span>{parsedOutput.data.mutationRule}</span></li>
										<li><strong>Engine</strong><span>{parsedOutput.data.serialEngine}</span></li>
										<li><strong>Scene proof</strong><span>{parsedOutput.data.sceneProof}</span></li>
									</ul>
								{/if}
							{:else if artifact.id === 'council-review'}
								{@const parsedOutput = councilReviewOutputSchema.safeParse(artifact.result.output)}
								{#if parsedOutput.success}
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
							{/if}
						{/if}
					</article>
				{/each}
			</section>

			<section class="grid three">
				<div class="panel">
					<p class="eyebrow">Contest signals</p>
					<ul class="clean-list">
						{#each studioRun.brief.judgingSignals as signal (signal)}
							<li>{signal}</li>
						{/each}
					</ul>
				</div>

				<div class="panel">
					<p class="eyebrow">Mandatory elements</p>
					<ul class="clean-list">
						{#each studioRun.brief.mandatoryElements as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</div>

				<div class="panel">
					<p class="eyebrow">Prompt pressure</p>
					<p>{studioRun.brief.promptPressure}</p>
				</div>
			</section>
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #fff8ea;
		color: #191713;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-shell {
		min-height: 100vh;
		background:
			linear-gradient(90deg, rgba(15, 143, 131, 0.08) 1px, transparent 1px),
			linear-gradient(180deg, rgba(111, 60, 123, 0.07) 1px, transparent 1px), #fff8ea;
		background-size: 42px 42px;
	}

	.workbench {
		display: grid;
		grid-template-columns: minmax(290px, 370px) minmax(0, 1fr);
		min-height: 100vh;
	}

	.control-rail {
		position: sticky;
		top: 0;
		align-self: start;
		min-height: 100vh;
		padding: 24px;
		background: #191713;
		color: #fff8ea;
		border-right: 1px solid rgba(255, 255, 255, 0.12);
	}

	.brand-lockup {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.mark {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		background: #e9543f;
		color: #fff8ea;
		font-weight: 900;
	}

	.eyebrow {
		margin: 0 0 8px;
		color: #0f8f83;
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	.control-rail .eyebrow {
		color: #8bd8cf;
	}

	h1,
	h2,
	h3,
	h4,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 0;
		font-size: 22px;
		line-height: 1.05;
	}

	h2 {
		margin-bottom: 10px;
		font-size: 28px;
		line-height: 1.08;
	}

	h3 {
		margin-bottom: 0;
		font-size: 18px;
		line-height: 1.15;
	}

	h4 {
		margin-bottom: 0;
		font-size: 15px;
		line-height: 1.25;
	}

	label,
	.mechanism-picker {
		display: grid;
		gap: 8px;
		margin: 14px 0;
	}

	label span,
	.mechanism-picker p {
		margin: 0;
		color: rgba(255, 248, 234, 0.72);
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.08);
		color: inherit;
		font: inherit;
		padding: 10px 11px;
	}

	select option {
		color: #191713;
	}

	textarea {
		resize: vertical;
	}

	.number-grid,
	.live-action {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.mechanism-picker {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.mechanism-picker p {
		grid-column: 1 / -1;
	}

	button {
		min-height: 42px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.06);
		color: #fff8ea;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
		font-weight: 800;
	}

	button.active {
		background: #0f8f83;
		border-color: #8bd8cf;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.66;
	}

	.live-action {
		align-items: end;
		margin-top: 18px;
		padding-top: 18px;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
	}

	.live-action label {
		margin: 0;
	}

	.live-action button {
		background: #e9543f;
		border-color: #e9543f;
	}

	.output-rail {
		display: grid;
		gap: 18px;
		padding: 24px;
	}

	.score-band,
	.thesis-band,
	.visual-band,
	.alert-band,
	.panel,
	.artifact {
		background: rgba(255, 255, 255, 0.78);
		border: 1px solid rgba(25, 23, 19, 0.12);
		border-radius: 8px;
		box-shadow: 0 12px 30px rgba(25, 23, 19, 0.06);
	}

	.score-band {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 20px;
		align-items: center;
		padding: 20px;
	}

	.score-band h2 {
		margin: 0;
		color: #e9543f;
		font-size: 54px;
		line-height: 0.9;
	}

	.mode-pill {
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

	.mode-pill.busy {
		background: rgba(216, 155, 39, 0.18);
		color: #6f3c7b;
	}

	.score-stack {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.metric {
		display: grid;
		gap: 6px;
		min-height: 74px;
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

	.metric.locked {
		border-color: rgba(216, 155, 39, 0.42);
	}

	.alert-band {
		padding: 14px 16px;
		border-color: rgba(233, 84, 63, 0.42);
		background: #fff2ee;
		color: #6f3c7b;
	}

	.alert-band p:last-child,
	.panel p:last-child,
	.thesis-band p:last-child {
		margin-bottom: 0;
	}

	.thesis-band,
	.visual-band,
	.panel,
	.artifact {
		padding: 18px;
	}

	.thesis-band p {
		max-width: 980px;
		color: #504a43;
		font-size: 16px;
	}

	.brief-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}

	.brief-strip span,
	.next-action strong,
	.module-header span,
	.artifact small {
		color: #2f6fbb;
		font-size: 12px;
		font-weight: 900;
		text-transform: uppercase;
	}

	.brief-strip span {
		padding: 5px 8px;
		border: 1px solid rgba(47, 111, 187, 0.18);
		background: rgba(47, 111, 187, 0.08);
	}

	.visual-band {
		background: #221f1d;
		color: #fff8ea;
	}

	.grid,
	.module-grid,
	.council-grid,
	.beat-list,
	.clean-list,
	.debt-list,
	.issue-list {
		display: grid;
		gap: 14px;
	}

	.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.module-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.council-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.beat-list,
	.clean-list,
	.debt-list,
	.issue-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.beat-list li {
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: 12px;
	}

	.beat-list li > span {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		background: #2f6fbb;
		color: #fff;
		font-weight: 900;
	}

	.beat-list li.accepted > span {
		background: #0f8f83;
	}

	.beat-list li.failed > span,
	.beat-list li.rejected > span {
		background: #e9543f;
	}

	.beat-list li.locked > span {
		background: #d89b27;
	}

	.beat-list p,
	.clean-list span,
	.clean-list em,
	.debt-list span,
	.debt-list em {
		display: block;
		margin: 3px 0 0;
		color: #504a43;
		font-style: normal;
	}

	.visual-band .beat-list p {
		color: rgba(255, 248, 234, 0.74);
	}

	.clean-list li,
	.debt-list li {
		padding-left: 12px;
		border-left: 3px solid #d89b27;
		color: #504a43;
	}

	.clean-list li.winner {
		border-color: #0f8f83;
		background: rgba(15, 143, 131, 0.06);
	}

	.debt-list li {
		border-color: #e9543f;
	}

	.artifact {
		display: grid;
		gap: 12px;
		align-content: start;
	}

	.artifact.accepted {
		border-color: rgba(15, 143, 131, 0.36);
	}

	.artifact.failed,
	.artifact.rejected {
		border-color: rgba(233, 84, 63, 0.44);
		background: #fff2ee;
	}

	.artifact.locked {
		border-color: rgba(216, 155, 39, 0.42);
		background: rgba(242, 227, 191, 0.5);
	}

	.module-header {
		display: grid;
		gap: 5px;
	}

	.artifact p,
	.artifact li,
	.panel li,
	.panel p,
	.council-grid p,
	.council-grid em {
		color: #504a43;
		font-size: 14px;
		line-height: 1.45;
	}

	.next-action {
		display: grid;
		gap: 4px;
		padding: 10px;
		border: 1px solid rgba(216, 155, 39, 0.35);
		background: rgba(216, 155, 39, 0.1);
	}

	.next-action span {
		color: #504a43;
		font-size: 14px;
	}

	.issue-list {
		padding-left: 18px;
		color: #6f3c7b;
		list-style: disc;
	}

	.council-grid section {
		display: grid;
		gap: 8px;
		padding: 12px;
		border: 1px solid rgba(15, 143, 131, 0.2);
		background: rgba(15, 143, 131, 0.06);
	}

	.council-grid span,
	.council-grid em {
		color: #6f3c7b;
		font-size: 12px;
		font-style: normal;
		font-weight: 900;
		text-transform: uppercase;
	}

	@media (max-width: 1040px) {
		.workbench,
		.score-band,
		.three,
		.module-grid,
		.council-grid {
			grid-template-columns: 1fr;
		}

		.control-rail {
			position: relative;
			min-height: auto;
		}

		.score-stack {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.control-rail,
		.output-rail {
			padding: 16px;
		}

		.number-grid,
		.live-action,
		.mechanism-picker,
		.score-stack {
			grid-template-columns: 1fr;
		}

		.score-band h2 {
			font-size: 44px;
		}
	}
</style>

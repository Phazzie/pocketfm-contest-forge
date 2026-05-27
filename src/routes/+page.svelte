<script lang="ts">
	import { createDefaultForge, defaultForgeRequest } from '$lib/application/createDefaultForge';
	import type {
		ContestGenre,
		ForgePlan,
		MechanismId,
		RiskTolerance,
		UseCaseResponse
	} from '$lib/core/contracts/contestForgeContract';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const forge = createDefaultForge();
	let selectedGenre = $state<ContestGenre>(defaultForgeRequest.contestId);
	let workingTitle = $state(defaultForgeRequest.seed.workingTitle);
	let protagonistName = $state(defaultForgeRequest.seed.protagonistName);
	let logline = $state(defaultForgeRequest.seed.logline);
	let emotionalPromise = $state(defaultForgeRequest.seed.emotionalPromise);
	let tabooLever = $state(defaultForgeRequest.seed.tabooLever);
	let episodeCountTarget = $state(defaultForgeRequest.seed.episodeCountTarget);
	let minutesPerEpisode = $state(defaultForgeRequest.seed.minutesPerEpisode);
	let riskLevel = $state<number>(defaultForgeRequest.riskTolerance);
	let selectedMechanisms = $state<MechanismId[]>([...defaultForgeRequest.selectedMechanisms]);

	const request = $derived({
		...defaultForgeRequest,
		contestId: selectedGenre,
		riskTolerance: Math.round(riskLevel) as RiskTolerance,
		selectedMechanisms,
		seed: {
			...defaultForgeRequest.seed,
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

	let result = $state<UseCaseResponse<ForgePlan> | null>(null);
	let isForging = $state(false);

	$effect(() => {
		const nextRequest = request;
		let cancelled = false;
		isForging = true;

		forge
			.forge(nextRequest)
			.then((nextResult) => {
				if (!cancelled) result = nextResult;
			})
			.finally(() => {
				if (!cancelled) isForging = false;
			});

		return () => {
			cancelled = true;
		};
	});

	const plan = $derived(result?.success ? result.data : data.initialPlan);
	const issues = $derived(result && !result.success ? (result.error.issues ?? []) : []);
	const scoreRows = $derived([
		['Contest score', plan.score.score],
		['First minute', plan.score.firstMinuteGrip],
		['Cliffhanger pull', plan.score.cliffhangerPull],
		['Audio flow', plan.score.audioFlow],
		['Novelty', plan.score.novelty]
	]);

	function toggleMechanism(id: MechanismId) {
		selectedMechanisms = selectedMechanisms.includes(id)
			? selectedMechanisms.filter((mechanism) => mechanism !== id)
			: [...selectedMechanisms, id];
	}
</script>

<main class="app-shell">
	<section class="workbench">
		<div class="control-rail">
			<div class="brand-lockup">
				<div class="mark">PF</div>
				<div>
					<p class="eyebrow">Contest forge</p>
					<h1>Pocket FM Writing Lab</h1>
				</div>
			</div>

			<label>
				<span>Contest lane</span>
				<select bind:value={selectedGenre}>
					{#each data.briefs as brief (brief.id)}
						<option value={brief.id}>{brief.contestName}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Working title</span>
				<input bind:value={workingTitle} />
			</label>

			<label>
				<span>Protagonist</span>
				<input bind:value={protagonistName} />
			</label>

			<label>
				<span>Logline</span>
				<textarea rows="5" bind:value={logline}></textarea>
			</label>

			<label>
				<span>Emotional promise</span>
				<input bind:value={emotionalPromise} />
			</label>

			<label>
				<span>Taboo lever</span>
				<input bind:value={tabooLever} />
			</label>

			<div class="number-grid">
				<label>
					<span>Episodes</span>
					<input type="number" min="30" max="300" bind:value={episodeCountTarget} />
				</label>

				<label>
					<span>Minutes</span>
					<input type="number" min="5" max="15" bind:value={minutesPerEpisode} />
				</label>
			</div>

			<label>
				<span>Risk tolerance {Math.round(riskLevel)}</span>
				<input type="range" min="1" max="5" step="1" bind:value={riskLevel} />
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
		</div>

		<div class="output-rail">
			<section class="score-band">
				<div>
					<p class="eyebrow">Live readiness</p>
					<h2>{plan.score.score}</h2>
					<span class="mode-pill" class:busy={isForging}>
						{isForging ? 'updating' : plan.generationMode}
					</span>
				</div>
				<div class="score-stack" aria-label="Contest readiness metrics">
					{#each scoreRows as row (row[0])}
						<div class="metric">
							<span>{row[0]}</span>
							<div class="meter"><i style={`width: ${row[1]}%`}></i></div>
							<strong>{row[1]}</strong>
						</div>
					{/each}
				</div>
			</section>

			{#if issues.length}
				<section class="alert-band">
					{#each issues as issue (`${issue.field}-${issue.message}`)}
						<p>{issue.field}: {issue.message}</p>
					{/each}
				</section>
			{/if}

			<section class="thesis-band">
				<p class="eyebrow">{plan.brief.prizeSignal}</p>
				<h2>{plan.oneSentencePremise}</h2>
				<p>{plan.strategicThesis}</p>
			</section>

			<section class="visual-band" aria-label="Retention heatmap">
				<div class="heatmap">
					{#each plan.score.heatmap as point (point.minute)}
						<div class="heat-column">
							<i style={`height: ${point.intensity}%`}></i>
							<span>{point.minute}m</span>
						</div>
					{/each}
				</div>
				<div class="audio-sigil">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			</section>

			<section class="grid two">
				<div class="panel">
					<p class="eyebrow">Pilot episode</p>
					<h2>{plan.pilot.title}</h2>
					<ol class="beat-list">
						{#each plan.pilot.beats as beat (beat.id)}
							<li>
								<span>{beat.minute}m</span>
								<div>
									<strong>{beat.function}</strong>
									<p>{beat.text}</p>
									<em>{beat.unansweredQuestion}</em>
								</div>
							</li>
						{/each}
					</ol>
				</div>

				<div class="panel">
					<p class="eyebrow">Cold open split test</p>
					<ul class="clean-list">
						{#each plan.pilot.coldOpenVariants as variant (variant)}
							<li>{variant}</li>
						{/each}
					</ul>

					<p class="eyebrow">Binge debt ledger</p>
					<ul class="debt-list">
						{#each plan.pilot.bingeDebtAdded as debt (debt)}
							<li>{debt}</li>
						{/each}
					</ul>
				</div>
			</section>

			<section class="grid mechanisms">
				{#each plan.mechanisms as mechanism (mechanism.id)}
					<article class="mechanism-card">
						<p>{mechanism.label}</p>
						<h3>{mechanism.artifact}</h3>
						<span>{mechanism.risk}</span>
					</article>
				{/each}
			</section>

			<section class="panel">
				<p class="eyebrow">Story modules</p>
				<div class="module-grid">
					{#each plan.moduleResults as module (module.moduleId)}
						<article class:failed={module.status === 'failed'}>
							<div class="module-header">
								<span>{module.status}</span>
								<h3>{module.label}</h3>
							</div>
							<p>{module.summary}</p>
							<small>
								{module.provenance.promptVersion} · {module.provenance.provider}
							</small>
							{#if module.issues.length}
								<ul>
									{#each module.issues as issue (`${module.moduleId}-${issue.code}-${issue.message}`)}
										<li>{issue.message}</li>
									{/each}
								</ul>
							{/if}
						</article>
					{/each}
				</div>
			</section>

			<section class="panel">
				<p class="eyebrow">AI council runbook</p>
				<div class="council-grid">
					{#each plan.aiCouncil as prompt (prompt.role)}
						<article>
							<span>{prompt.role}</span>
							<h3>{prompt.job}</h3>
							<p>{prompt.prompt}</p>
							<em>{prompt.expectedArtifact}</em>
						</article>
					{/each}
				</div>
			</section>

			<section class="grid three">
				<div class="panel">
					<p class="eyebrow">Contest signals</p>
					<ul class="clean-list">
						{#each plan.brief.judgingSignals as signal (signal)}
							<li>{signal}</li>
						{/each}
					</ul>
				</div>

				<div class="panel">
					<p class="eyebrow">Series rules</p>
					<ul class="clean-list">
						{#each plan.seriesRules as rule (rule)}
							<li>{rule}</li>
						{/each}
					</ul>
				</div>

				<div class="panel">
					<p class="eyebrow">Submission checks</p>
					<ul class="clean-list">
						{#each plan.submissionChecklist as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			</section>
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f5f3ef;
		color: #181716;
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
			linear-gradient(90deg, rgba(17, 111, 108, 0.08) 1px, transparent 1px),
			linear-gradient(180deg, rgba(126, 38, 50, 0.08) 1px, transparent 1px), #f5f3ef;
		background-size: 42px 42px;
	}

	.workbench {
		display: grid;
		grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
		min-height: 100vh;
	}

	.control-rail {
		position: sticky;
		top: 0;
		align-self: start;
		min-height: 100vh;
		padding: 24px;
		background: #1c1a18;
		color: #f8f4ec;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
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
		background: #e24d3d;
		color: #fff;
		font-weight: 900;
	}

	.eyebrow {
		margin: 0 0 8px;
		color: #11706c;
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.control-rail .eyebrow {
		color: #78d4c8;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 0;
		font-size: 1.35rem;
	}

	h2 {
		font-size: clamp(1.35rem, 2vw, 2.2rem);
		line-height: 1.05;
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
		color: rgba(248, 244, 236, 0.72);
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.08);
		color: inherit;
		font: inherit;
		padding: 10px 11px;
	}

	select option {
		color: #181716;
	}

	textarea {
		resize: vertical;
	}

	.number-grid {
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
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.06);
		color: #f8f4ec;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 800;
	}

	button.active {
		background: #11706c;
		border-color: #78d4c8;
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
	.mechanism-card {
		background: rgba(255, 255, 255, 0.74);
		border: 1px solid rgba(24, 23, 22, 0.1);
		border-radius: 8px;
		box-shadow: 0 12px 30px rgba(24, 23, 22, 0.06);
	}

	.score-band {
		display: grid;
		grid-template-columns: 180px 1fr;
		gap: 20px;
		align-items: center;
		padding: 20px;
	}

	.score-band h2 {
		margin: 0;
		color: #e24d3d;
		font-size: 5rem;
		line-height: 0.85;
	}

	.mode-pill {
		display: inline-flex;
		margin-top: 10px;
		padding: 5px 8px;
		border-radius: 999px;
		background: rgba(17, 112, 108, 0.12);
		color: #11706c;
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.mode-pill.busy {
		background: rgba(224, 170, 49, 0.18);
		color: #7e2632;
	}

	.score-stack {
		display: grid;
		gap: 10px;
	}

	.metric {
		display: grid;
		grid-template-columns: 130px 1fr 34px;
		gap: 10px;
		align-items: center;
		font-size: 0.88rem;
	}

	.meter {
		overflow: hidden;
		height: 9px;
		background: #ddd7cc;
		border-radius: 999px;
	}

	.meter i {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #11706c, #e0aa31, #e24d3d);
	}

	.alert-band {
		padding: 12px 16px;
		border-color: rgba(226, 77, 61, 0.42);
		background: #fff2ee;
		color: #7e2632;
	}

	.alert-band p:last-child {
		margin-bottom: 0;
	}

	.thesis-band {
		padding: 24px;
	}

	.thesis-band p:last-child {
		max-width: 980px;
		margin-bottom: 0;
		color: #504a43;
		font-size: 1.04rem;
	}

	.visual-band {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: 22px;
		align-items: stretch;
		padding: 20px;
		min-height: 190px;
		background: #221f1d;
	}

	.heatmap {
		display: flex;
		align-items: end;
		gap: 12px;
		min-height: 150px;
	}

	.heat-column {
		display: grid;
		grid-template-rows: 1fr auto;
		align-items: end;
		gap: 8px;
		flex: 1;
		height: 150px;
		color: rgba(248, 244, 236, 0.7);
		text-align: center;
		font-size: 0.72rem;
	}

	.heat-column i {
		display: block;
		min-height: 18px;
		border-radius: 4px 4px 0 0;
		background: linear-gradient(180deg, #e24d3d, #e0aa31 46%, #11706c);
	}

	.audio-sigil {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		align-items: center;
	}

	.audio-sigil div {
		height: 100%;
		min-height: 120px;
		background:
			radial-gradient(circle at 50% 20%, rgba(226, 77, 61, 0.9), transparent 22%),
			linear-gradient(180deg, rgba(120, 212, 200, 0.7), rgba(224, 170, 49, 0.9));
		border-radius: 8px;
	}

	.audio-sigil div:nth-child(2) {
		min-height: 80px;
	}

	.audio-sigil div:nth-child(3) {
		min-height: 150px;
	}

	.grid {
		display: grid;
		gap: 18px;
	}

	.two {
		grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
	}

	.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.mechanisms {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.council-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14px;
	}

	.module-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14px;
	}

	.panel,
	.mechanism-card {
		padding: 18px;
	}

	.beat-list,
	.clean-list,
	.debt-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.beat-list {
		display: grid;
		gap: 14px;
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
		background: #11706c;
		color: #fff;
		font-weight: 900;
	}

	.beat-list p,
	.beat-list em {
		display: block;
		margin: 3px 0 0;
		color: #504a43;
	}

	.beat-list em {
		color: #7e2632;
		font-style: normal;
		font-weight: 700;
	}

	.clean-list,
	.debt-list {
		display: grid;
		gap: 10px;
		margin-bottom: 22px;
	}

	.clean-list li,
	.debt-list li {
		padding-left: 12px;
		border-left: 3px solid #e0aa31;
		color: #504a43;
	}

	.debt-list li {
		border-color: #e24d3d;
	}

	.mechanism-card {
		display: grid;
		align-content: space-between;
		min-height: 210px;
	}

	.mechanism-card p {
		color: #11706c;
		font-size: 0.78rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.mechanism-card h3 {
		font-size: 1rem;
		line-height: 1.25;
	}

	.mechanism-card span {
		color: #7e2632;
		font-size: 0.84rem;
		font-weight: 700;
	}

	.module-grid article {
		display: grid;
		gap: 10px;
		align-content: start;
		padding: 14px;
		border: 1px solid rgba(126, 38, 50, 0.16);
		border-radius: 8px;
		background: rgba(224, 170, 49, 0.08);
	}

	.module-grid article.failed {
		border-color: rgba(226, 77, 61, 0.4);
		background: #fff2ee;
	}

	.module-header {
		display: grid;
		gap: 5px;
	}

	.module-header span,
	.module-grid small {
		color: #11706c;
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.module-header h3,
	.module-grid p {
		margin-bottom: 0;
	}

	.module-grid p,
	.module-grid li {
		color: #504a43;
		font-size: 0.9rem;
	}

	.module-grid ul {
		margin: 0;
		padding-left: 18px;
	}

	.council-grid article {
		display: grid;
		gap: 10px;
		align-content: start;
		padding: 14px;
		border: 1px solid rgba(17, 112, 108, 0.18);
		border-radius: 8px;
		background: rgba(17, 112, 108, 0.06);
	}

	.council-grid span,
	.council-grid em {
		color: #7e2632;
		font-size: 0.78rem;
		font-style: normal;
		font-weight: 900;
		text-transform: uppercase;
	}

	.council-grid h3,
	.council-grid p {
		margin-bottom: 0;
	}

	.council-grid p {
		color: #504a43;
		font-size: 0.9rem;
	}

	@media (max-width: 1040px) {
		.workbench,
		.score-band,
		.visual-band,
		.two,
		.three,
		.mechanisms,
		.module-grid,
		.council-grid {
			grid-template-columns: 1fr;
		}

		.control-rail {
			position: relative;
			min-height: auto;
		}

		.mechanisms {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.module-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.control-rail,
		.output-rail {
			padding: 16px;
		}

		.number-grid,
		.mechanism-picker,
		.metric,
		.mechanisms,
		.module-grid {
			grid-template-columns: 1fr;
		}

		.score-band h2 {
			font-size: 4rem;
		}
	}
</style>

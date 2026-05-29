<!-- Created: 2026-05-29 15:42 -->

<script lang="ts">
	import type {
		ContestBrief,
		ContestGenre,
		MechanismId
	} from '$lib/core/contracts/contestForgeContract';
	import type { mechanismCatalog } from '$lib/core/domain/mechanisms';

	interface Props {
		briefs: ContestBrief[];
		mechanisms: typeof mechanismCatalog;
		selectedGenre: ContestGenre;
		workingTitle: string;
		protagonistName: string;
		logline: string;
		emotionalPromise: string;
		tabooLever: string;
		episodeCountTarget: number;
		minutesPerEpisode: number;
		riskLevel: number;
		selectedMechanisms: MechanismId[];
		liveAccessCode: string;
		isLiveSubmitting: boolean;
		onSubmit: () => void;
	}

	let {
		briefs,
		mechanisms,
		selectedGenre = $bindable(),
		workingTitle = $bindable(),
		protagonistName = $bindable(),
		logline = $bindable(),
		emotionalPromise = $bindable(),
		tabooLever = $bindable(),
		episodeCountTarget = $bindable(),
		minutesPerEpisode = $bindable(),
		riskLevel = $bindable(),
		selectedMechanisms = $bindable(),
		liveAccessCode = $bindable(),
		isLiveSubmitting,
		onSubmit
	}: Props = $props();

	function toggleMechanism(id: MechanismId) {
		selectedMechanisms = selectedMechanisms.includes(id)
			? selectedMechanisms.filter((mechanism) => mechanism !== id)
			: [...selectedMechanisms, id];
	}
</script>

<form class="control-rail" method="POST" action="?/runLiveStudio" onsubmit={onSubmit}>
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
			{#each briefs as brief (brief.id)}
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
		<textarea name="emotionalPromise" rows="2" bind:value={emotionalPromise}></textarea>
	</label>

	<label>
		<span>Taboo lever</span>
		<textarea name="tabooLever" rows="2" bind:value={tabooLever}></textarea>
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

	<label class="risk-control">
		<span>Risk tolerance {Math.round(riskLevel)}</span>
		<input name="riskTolerance" type="range" min="1" max="5" step="1" bind:value={riskLevel} />
	</label>

	<div class="mechanism-picker">
		<p>Mechanisms</p>
		{#each mechanisms as mechanism (mechanism.id)}
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

<style>
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
		color: #8bd8cf;
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: 22px;
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

	.risk-control {
		overflow: hidden;
	}

	input[type='range'] {
		min-width: 0;
		width: calc(100% - 4px);
		justify-self: center;
		padding-right: 0;
		padding-left: 0;
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

	@media (max-width: 1040px) {
		.control-rail {
			position: relative;
			min-height: auto;
		}
	}

	@media (max-width: 620px) {
		.control-rail {
			padding: 16px;
		}

		.number-grid,
		.live-action,
		.mechanism-picker {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import LiveRunPanel from '$lib/components/story-studio/LiveRunPanel.svelte';
	import SeedPanel from '$lib/components/story-studio/SeedPanel.svelte';
	import { defaultForgeRequest } from '$lib/application/defaultForgeRequest';
	import { requestsMatch } from '$lib/application/forgeRequestEquality';
	import type {
		ContestGenre,
		ForgeRequest,
		MechanismId,
		RiskTolerance
	} from '$lib/core/contracts/contestForgeContract';
	import type { StoryStudioResponse } from '$lib/core/contracts/storyStudioContract';
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
	const selectedInitialStudioRun = $derived(
		data.initialStudioRuns[selectedGenre] ?? data.initialStudioRun
	);
	const studioRun = $derived(storyStudio?.success ? storyStudio.data : selectedInitialStudioRun);
	const studioError = $derived(storyStudio && !storyStudio.success ? storyStudio.error : null);

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
</script>

<main class="app-shell">
	<section class="workbench">
		<SeedPanel
			briefs={data.briefs}
			mechanisms={data.mechanisms}
			bind:selectedGenre
			bind:workingTitle
			bind:protagonistName
			bind:logline
			bind:emotionalPromise
			bind:tabooLever
			bind:episodeCountTarget
			bind:minutesPerEpisode
			bind:riskLevel
			bind:selectedMechanisms
			bind:liveAccessCode
			{isLiveSubmitting}
			onSubmit={markLiveSubmit}
		/>

		<LiveRunPanel run={studioRun} {workingTitle} {logline} {isLiveSubmitting} {studioError} />
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

	@media (max-width: 1040px) {
		.workbench {
			grid-template-columns: 1fr;
		}
	}
</style>

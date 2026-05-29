// Created: 2026-05-26 14:50

import type { CouncilReviewInput, CouncilReviewOutput } from './contract';

export const councilReviewFixtureInput: CouncilReviewInput = {
	seed: {
		workingTitle: 'The Crown That Eats Names',
		protagonistName: 'Mara Vey',
		genre: 'medieval-fantasy',
		logline:
			'Mara Vey weaponizes a crown that devours the name of every ruler who lies, but every victory makes desire more dangerous.',
		emotionalPromise: 'Every victory makes desire more dangerous.',
		tabooLever: 'loving the person who benefited from your erasure'
	},
	contestBrief: {
		id: 'medieval-fantasy',
		contestName: 'Medieval Fantasy Power Hook',
		formatSignal: 'audio-first serial contest brief v1',
		promptPressure: 'Make the cursed object change public power before lore expands.',
		mandatoryElements: ['cursed crown', 'court betrayal']
	},
	acceptedArtifacts: [
		{
			artifactId: 'cold-open-lab',
			label: 'Cold open lab',
			summary: 'Mara loses her public name in court before the crown rules are explained.',
			evidence: [
				'Mara Vey loses her public name in court because her lover brings proof of the stolen crown debt.',
				'The first-minute question asks what proof can force Mara to pay a debt everyone hears.'
			]
		},
		{
			artifactId: 'binge-debt-ledger',
			label: 'Binge debt ledger',
			summary: 'The live ledger opens name and lover-proof debts with early payoff windows.',
			evidence: [
				'The stolen-name debt pays pressure through public ceremonies in episodes 2-4.',
				'The lover-proof debt costs Mara private trust while the court watches.'
			]
		},
		{
			artifactId: 'cliffhanger-futures',
			label: 'Cliffhanger futures',
			summary: 'The recommended ending reprices the enemy knowing Mara erased name.',
			evidence: [
				'Episode two reveals the antagonist bought a name clue from the lover witness at a public price.',
				'Audience trust risk rises if the name proof is withheld beyond the next court consequence.'
			]
		},
		{
			artifactId: 'trope-mutation-lab',
			label: 'Trope mutation lab',
			summary: 'The rightful-heir trope mutates into public belief crowning power.',
			evidence: [
				'The crown only recognizes whoever can make the public believe the cruelest version of the truth.',
				'Mara wins a court trial by making the crowd believe her lover lied, then loses a witness name.'
			]
		}
	],
	rejectedArtifacts: [],
	priorQualityIssues: []
};

export const councilReviewFixtureOutput: CouncilReviewOutput = {
	roles: [
		{
			role: 'listener-saboteur',
			finding:
				'The strongest listener pull is Mara losing her public name before the crown rule is explained.',
			evidence:
				'Cold-open evidence puts Mara, the court, the lover proof, and the stolen name debt in one audible event.',
			revisionMove:
				'Keep the first revision inside the court scene and make the lover hand over the proof before any lore.',
			riskIfIgnored:
				'Specific risk: if the opening moves into history first, listeners may miss the public status wound and drop before the debt appears.',
			confidence: 0.88
		},
		{
			role: 'trope-criminal',
			finding:
				'The rightful-heir trope stays familiar because the throne still matters, but public belief now crowns power.',
			evidence:
				'Trope mutation evidence keeps the crown, court betrayal, public belief, and Mara private cost visible.',
			revisionMove:
				'Add one public witness who changes allegiance after the crowd believes the crueler truth about Mara.',
			riskIfIgnored:
				'Audience risk: if the mutation becomes abstract philosophy, the audience loses the familiar throne revenge doorway.',
			confidence: 0.82
		},
		{
			role: 'debt-auditor',
			finding:
				'The name debt and lover-proof debt have useful early payoff windows but must not both pay in episode two.',
			evidence:
				'The ledger schedules stolen-name pressure for episodes 2-4 and lover-proof pressure for episodes 2-3.',
			revisionMove:
				'Pay only one public clue in episode two, then make the unpaid lover proof cost Mara trust in episode three.',
			riskIfIgnored:
				'Specific risk: paying both debts at once would drain the binge engine and leave the next court consequence weak.',
			confidence: 0.86
		},
		{
			role: 'voice-actor-ghost',
			finding:
				'The audio spine works when every scene names Mara, the court, the lover, and the crown price aloud.',
			evidence:
				'Accepted artifacts repeatedly use court, lover proof, public name loss, and crown response as spoken anchors.',
			revisionMove:
				'Rewrite the ending line so the antagonist says Mara old name once and the crowd repeats the wrong title.',
			riskIfIgnored:
				'Audience risk: if the magic rule is only visual, audio listeners may miss who paid the name price.',
			confidence: 0.8
		},
		{
			role: 'contest-judge',
			finding:
				'The concept fits the medieval fantasy power lane because the cursed crown changes public authority fast.',
			evidence:
				'The contest brief asks for cursed-object pressure before lore, and the accepted artifacts show court betrayal.',
			revisionMove:
				'Put the cursed crown consequence in the first two minutes and make the court price public before royal history.',
			riskIfIgnored:
				'Specific risk: if the submission waits too long on crown mechanics, it may read like generic palace intrigue.',
			confidence: 0.84
		},
		{
			role: 'continuity-keeper',
			finding:
				'Mara erased name, the lover witness, and the crown belief rule must stay locked as continuity facts.',
			evidence:
				'Cold-open, debt, cliffhanger, and trope artifacts all depend on the same name theft and witness proof.',
			revisionMove:
				'Track who knows Mara old name after every public ceremony and mark each witness memory as paid or stolen.',
			riskIfIgnored:
				'Specific risk: loose name continuity would make the antagonist proof feel fake and weaken every later payoff.',
			confidence: 0.9
		}
	],
	consensus:
		'The story is demo-ready as a concept if the next revision keeps public name theft, lover proof, and cursed crown cost in the same audible chain.',
	topRevisionMove:
		'Rebuild episode two around one court witness using Mara stolen name to collect a public price while the lover withholds proof.',
	greenlight: 'ready-for-demo'
};

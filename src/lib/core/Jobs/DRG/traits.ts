import { cleaner, state } from '../../../../contexts/state';
import { defineTraits } from '../../Trait';
import { Job } from '../../classification';

const names = [
	'Blood of the Dragon',
	'Lance Mastery',
	'Life of the Dragon',
	'Jump Mastery',
	'Lance Mastery II',
	'Life of the Dragon Mastery',
	'Enhanced Coerthan Torment',
	'Enhanced Spineshatter Dive',
	'Lance Mastery III',
	'Enhanced Life Surge',
	'Lance Mastery IV',
] as const;
export type DRGTraitName = (typeof names)[number];

export const DRGTraits = defineTraits(
	Job.DRG_FFXIV,
	({
		adjustActionProperty,
		adjustEffectProperty,
		registerEffectTrigger,
		registerEffectCallback,
		swapAction,
		prevActionWas,
	}) => [
		{
			name: 'Blood of the Dragon',
			level: 54,
			onAcquire: cleaner.batchPush(
				adjustActionProperty('Jump', 'potency', 70),
				adjustActionProperty('Spineshatter Dive', 'potency', 60)
			),
		},
		{
			name: 'Lance Mastery',
			level: 64,
			onAcquire: cleaner.batchPush(
				adjustActionProperty('Fang and Claw', 'potency', 100),
				adjustActionProperty('Wheeling Thrust', 'potency', 100),

				registerEffectTrigger(
					'Use',
					'Fang and Claw',
					'Wheel in Motion',
					prevActionWas('Not', 'Wheeling Thrust')
				),
				registerEffectTrigger(
					'Use',
					'Wheeling Thrust',
					'Fang and Claw Bared',
					prevActionWas('Not', 'Fang and Claw')
				)
			),
		},
		{
			name: 'Life of the Dragon',
			level: 70,
			onAcquire: registerEffectTrigger(
				'Use',
				'Geirskogul',
				'Life of the Dragon'
			),
		},
		{
			name: 'Jump Mastery',
			level: 74,
			onAcquire: swapAction('Jump', 'High Jump'),
		},
		{
			name: 'Lance Mastery II',
			level: 76,
			onAcquire: cleaner.batchPush(
				adjustActionProperty('True Thrust', 'potency', 230),
				adjustActionProperty('Vorpal Thrust', 'potency', 130),

				registerEffectTrigger(
					'Use',
					'Fang and Claw',
					'Draconian Fire',
					prevActionWas('Wheeling Thrust')
				),
				registerEffectTrigger(
					'Use',
					'Wheeling Thrust',
					'Draconian Fire',
					prevActionWas('Fang and Claw')
				),

				registerEffectCallback(
					'Draconian Fire',
					'Apply',
					swapAction('True Thrust', 'Raiden Thrust')
				)
			),
		},
		{
			name: 'Life of the Dragon Mastery',
			level: 78,
			onAcquire: adjustEffectProperty('Life of the Dragon', 'duration', 10),
		},
		{
			name: 'Enhanced Coerthan Torment',
			level: 82,
			onAcquire: cleaner.batchPush(
				registerEffectTrigger('Combo', 'Coerthan Torment', 'Draconian Fire'),

				registerEffectCallback(
					'Draconian Fire',
					'Apply',
					swapAction('Doom Spike', 'Draconian Fury')
				)
			),
		},
		{
			name: 'Enhanced Spineshatter Dive',
			level: 84,
			onAcquire: adjustActionProperty('Spineshatter Dive', 'charges', 1),
		},
		{
			name: 'Lance Mastery III',
			level: 86,
			onAcquire: cleaner.batchPush(
				swapAction('Full Thrust', "Heavens' Thrust"),
				swapAction('Chaos Thrust', 'Chaotic Spring')
			),
		},
		{
			name: 'Enhanced Life Surge',
			level: 88,
			onAcquire: adjustActionProperty('Life Surge', 'charges', 1),
		},
		{
			name: 'Lance Mastery IV',
			level: 90,
			onAcquire: cleaner.batchPush(
				adjustEffectProperty('Chaotic Spring', 'duration', 3),
				adjustActionProperty('Geirskogul', 'potency', 300),
				adjustActionProperty('Geirskogul', 'resourceGains', 'gauge2', 1),
				adjustActionProperty('Nastrond', 'potency', 300),
				adjustActionProperty('Nastrond', 'resourceGains', 'gauge2', 1)
			),
		},
	]
);

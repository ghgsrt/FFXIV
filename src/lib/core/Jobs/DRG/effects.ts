import { cleaner } from '../../../../contexts/state';
import { defineEffects } from '../../Effect';
import { Job } from '../../classification';

const names = [
	'Dive Ready',
	'Chaos Thrust',
	'Chaotic Spring',
	'Wheel in Motion',
	'Fang and Claw Bared',
	'Life of the Dragon',
	'Draconian Fire',
] as const;
export type DRGEffectName = (typeof names)[number];

export const DRGEffects = defineEffects(Job.DRG_FFXIV, ({ swapAction }) => [
	{
		name: 'Dive Ready',
		img: 'Mirage Dive',
		duration: 15,
		onApply: () => console.log('Dive Ready applied'),
	},
	{
		name: 'Chaos Thrust',
		dotPotency: 40,
		duration: 24,
		onApply: () => console.log('Chaos Thrust DoT applied'),
	},
	{
		name: 'Chaotic Spring',
		dotPotency: 45,
		duration: 24,
		onApply: () => console.log('Chaotic Spring DoT applied'),
	},
	{
		name: 'Wheel in Motion',
		img: 'Wheeling Thrust',
		duration: 30,
		deactivateOn: 'melee',
		onApply: () => console.log('Wheel in Motion applied'),
	} as const,
	{
		name: 'Fang and Claw Bared',
		img: 'Fang and Claw',
		duration: 30,
		deactivateOn: 'melee',
		onApply: () => console.log('Fang and Claw Bared applied'),
	} as const,
	{
		name: 'Life of the Dragon',
		img: 'Nastrond',
		resourceCosts: {
			gauge: 2,
		},
		duration: 20,
		onApply: cleaner.batchPush(
			//! set gauge2 and make it tick
			swapAction('Geirskogul', 'Nastrond')
		),
	},
	{
		name: 'Draconian Fire',
		img: 'Raiden Thrust',
		duration: 30,
		deactivateOn: 'melee',
		onApply: () => {
			// swapAction('True Thrust', 'Raiden Thrust')('Draconian Fire');
		},
	} as const,
]);

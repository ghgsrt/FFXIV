import { defineEffects } from '../../Effect';
import { Class } from '../../classification';

const names = ['Power Surge'] as const;
export type LNCEffectName = (typeof names)[number];

export const LNCEffects = defineEffects(Class.LNC_FFXIV, () => [
	{
		name: 'Power Surge',
		img: 'Disembowel',
		duration: 30,
		onApply: () => console.log('Power Surge effect applied!'),
	},
]);

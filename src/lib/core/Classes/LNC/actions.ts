import { ActionType, defineActions } from '../../Action';
import { Class } from '../../classification';

const names = [
	'True Thrust',
	'Vorpal Thrust',
	'Life Surge',
	'Piercing Talon',
	'Disembowel',
	'Full Thrust',
	'Lance Charge',
] as const;
export type LNCActionName = (typeof names)[number];

export const LNCActions = defineActions(
	Class.LNC_FFXIV,
	({ activateEffect }) => [
		{
			name: 'True Thrust',
			level: 1,
			type: ActionType.WEAPON_SKILL,
			potency: 230,
			breaksCombo: true,
			onUse: () => console.log('True Thrust used!'),
		},
		{
			name: 'Vorpal Thrust',
			level: 4,
			type: ActionType.WEAPON_SKILL,
			potency: 130,
			comboPotency: 280,
			breaksCombo: true,
			combos: ['True Thrust', 'Raiden Thrust'],
			onUse: () => console.log('Vorpal Thrust used!'),
		},
		{
			name: 'Life Surge',
			level: 6,
			type: ActionType.ABILITY,
			recast: 40,
			range: 0,
			onUse: () => console.log('Life Surge used!'),
		},
		{
			name: 'Piercing Talon',
			level: 15,
			type: ActionType.WEAPON_SKILL,
			potency: 150,
			range: 20,
			onUse: () => console.log('Piercing Talon used!'),
		},
		{
			name: 'Disembowel',
			level: 18,
			type: ActionType.WEAPON_SKILL,
			potency: 140,
			comboPotency: 250,
			breaksCombo: true,
			combos: ['True Thrust', 'Raiden Thrust'],
			onUse: () => console.log('Disembowel used!'),
			onCombo: () => activateEffect('Power Surge'),
		},
		{
			name: 'Full Thrust',
			level: 26,
			type: ActionType.WEAPON_SKILL,
			potency: 100,
			comboPotency: 400,
			breaksCombo: true,
			combos: ['Vorpal Thrust'],
		},
		{
			name: 'Lance Charge',
			level: 30,
			type: ActionType.ABILITY,
			recast: 60,
			range: 0,
			onUse: () => console.log('Lance Charge used!'),
		},
	]
);

import { ActionType, defineActions } from '../Action';
import { Role } from '../classification';

const names = [
	'Second Wind',
	'Leg Sweep',
	'Bloodbath',
	'Feint',
	"Arm's Length",
	'True North',
] as const;
export type RoleActionName = (typeof names)[number];

export const RoleActions = defineActions('Role', () => [
	{
		name: 'Second Wind',
		job: [Role.M_DPS_FFXIV, Role.PR_DPS_FFXIV],
		level: 8,
		type: ActionType.ABILITY,
		recast: 120,
		onUse: () => console.log('Second Wind used!'),
	},
	{
		name: 'Leg Sweep',
		job: [Role.M_DPS_FFXIV],
		level: 10,
		type: ActionType.ABILITY,
		recast: 40,
		onUse: () => console.log('Leg Sweep used!'),
	},
	{
		name: 'Bloodbath',
		job: [Role.M_DPS_FFXIV],
		level: 12,
		type: ActionType.ABILITY,
		recast: 90,
		range: 0,
		onUse: () => console.log('Bloodbath used!'),
	},
	{
		name: 'Feint',
		job: [Role.M_DPS_FFXIV],
		level: 22,
		type: ActionType.ABILITY,
		recast: 90,
		range: 10,
		onUse: () => console.log('Feint used!'),
	},
	{
		name: "Arm's Length",
		job: [Role.M_DPS_FFXIV, Role.TNK_FFXIV, Role.PR_DPS_FFXIV],
		level: 32,
		type: ActionType.ABILITY,
		recast: 120,
		range: 0,
		onUse: () => console.log("Arm's Length used!"),
	},
	{
		name: 'True North',
		job: [Role.M_DPS_FFXIV],
		level: 50,
		type: ActionType.ABILITY,
		recast: 45,
		range: 0,
		onUse: () => console.log('True North used!'),
	},
]);

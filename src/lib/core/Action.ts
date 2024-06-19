import type { Resources } from '../../types/Session';
import { LNCActionName } from './Classes/LNC/actions';
import { DRGActionName } from './Jobs/DRG/actions';
import { defineItems } from './LUTs';
import { RoleActionName } from './Roles/actions';
import { Class, Classification, Job, Role } from './classification';

export enum ActionType {
	WEAPON_SKILL = 'Weapon Skill',
	SPELL = 'Spell',
	ABILITY = 'Ability',
}

export enum Pos {
	FRONT = 'Front',
	FLANK = 'Flank',
	REAR = 'Rear',
}

export type Action<C extends Classification | 'Role' = Classification> = {
	itemType: 'action';
	job: C extends 'Role' ? Role[] : C;
	category: string;
	name: ActionName<C>;
	description: string;
	img: string;
	level: number;
	type: ActionType;
	potency: number;
	comboPotency: number;
	positionalBonus: [Pos, number];
	charges: number;
	cast: number; // in seconds
	recast: number; // in seconds
	sharedRecast: string[]; // actions which share a recast
	resourceCosts: Resources;
	resourceGains: Resources;
	resCostType: 'flat' | 'multPercent' | 'addPercent';
	resGainType: 'flat' | 'multPercent' | 'addPercent';
	combos: string[]; // prev actions
	range: number; // in yalms
	radius: number; // in yalms
	breaksCombo: boolean;
	onUseCallbacks: { [key: string]: (name: ActionName<C>) => void };
	onComboCallbacks: { [key: string]: (name: ActionName<C>) => void };
	condition: () => boolean;
	onUse: (name: ActionName<C>) => void;
	onCombo: (name: ActionName<C>) => void;
};

export const defaultActionProps = {
	category: '',
	img: '', // [name-of-the-action].png, (don't add the ext.)
	description: '',
	potency: 0, // no potency
	comboPotency: 0, // no combo potency
	positionalBonus: undefined, // no positional bonus
	range: 3, // melee
	radius: 0, // no radius; single target
	cast: 0, // instant
	recast: -1, // GCD
	sharedRecast: undefined, // no shared recast
	charges: 1, // no additional charges
	resourceCosts: {
		mana: 0, // none
		gauge: 0, // none
		gauge2: 0, // none
	},
	resourceGains: {
		mana: 0, // none
		gauge: 0, // none
		gauge2: 0, // none
	},
	resCostType: 'multPercent',
	resGainType: 'multPercent',
	breaksCombo: false, // doesn't break combos
	combos: undefined, // no combos
	onUseCallbacks: {}, // empty registry
	onComboCallbacks: {}, // empty registry
	condition: () => true, // always usable
	onUse: () => {}, // no effect
	onCombo: () => {}, // no effect
} as const satisfies Partial<Action>;

// export const noopAction: Action = {
// 	...defaultActionProps,
// 	// @ts-ignore
// 	name: 'noop',
// 	job: Class.ACN,
// 	level: 0,
// 	type: ActionType.ABILITY,
// 	recast: 0,
// };

export const defineActions = defineItems('action', defaultActionProps);

export type ActionName<T extends Classification | 'Role' = Classification> =
	T extends [] | Role | 'Role'
		? RoleActionName
		: T extends Job.DRG_FFXIV
		? DRGActionName | LNCActionName
		: T extends Class.LNC_FFXIV
		? LNCActionName
		: never;

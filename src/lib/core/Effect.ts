import type { Resources } from '../../types/Session';
import { Class, Classification, Job, Role } from './classification';
import { DRGEffectName } from './Jobs/DRG/effects';
import { RoleEffectName } from './Roles/effects';
import { LNCEffectName } from './Classes/LNC/effects';
import { defineItems } from './LUTs';

export type Effect<C extends Classification | 'Role' = Classification> = {
	itemType: 'effect',
	job: C extends 'Role' ? Role[] : C;
	name: EffectName<C>;
	img: string;
	overTime: {};
	dotPotency: number;
	hotPotency: number;
	duration: number;
	deactivateOn: 'melee' | 'ranged' | 'magic' | 'any' | 'none';
	resourceCosts: Resources;
	resourceGain: Resources;
	resCostType: 'flat' | 'multPercent' | 'addPercent';
	resGainType: 'flat' | 'multPercent' | 'addPercent';
	onApplyCallbacks: { [key: string]: (name: EffectName<C>) => void };
	onTickCallbacks: { [key: string]: (name: EffectName<C>) => void };
	onExpireCallbacks: { [key: string]: (name: EffectName<C>) => void };
	onApply: (name: EffectName<C>) => void;
	onTick: () => void;
	onExpire: () => void;
};

export const defaultEffectProps = {
	img: '', // none
	overTime: {},
	dotPotency: 0, // no DoT
	hotPotency: 0, // no HoT
	deactivateOn: 'none', // deactivate on timeout
	resourceCosts: {
		gauge: 0, // no gauge cost
		gauge2: 0, // no gauge2 cost
		mana: 0, // no mana cost
	},
	resourceGain: {
		gauge: 0, // no gauge gain
		gauge2: 0, // no gauge2 gain
		mana: 0, // no mana gain
	},
	resCostType: 'multPercent',
	resGainType: 'multPercent',
	onApplyCallbacks: {}, // empty registry
	onTickCallbacks: {}, // empty registry
	onExpireCallbacks: {}, // empty registry
	onApply: () => {}, // no effect
	onTick: () => {}, // no effect
	onExpire: () => {}, // no effect
} as const satisfies Partial<Effect>;

export const defineEffects = defineItems('effect', defaultEffectProps);

export type EffectName<T extends Classification | 'Role' = Classification> =
	T extends [] | Role | 'Role'
		? RoleEffectName
		: T extends Job.DRG_FFXIV
		? DRGEffectName | LNCEffectName
		: T extends Class.LNC_FFXIV
		? LNCEffectName
		: never;

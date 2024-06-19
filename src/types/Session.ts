// import { HotbarConfig } from '../components/overlay/hotbar/Hotbar';
import { Action, ActionName } from '../lib/core/Action';
import { Effect } from '../lib/core/Effect';
import { Trait } from '../lib/core/Trait';
import { Class, Job, associations } from '../lib/core/classification';
import { Codes } from './KeyCodes';
import { Tuple } from './utils';

export type Stats = {};

export type Hotbar = Tuple<
	Tuple<
		{
			item: Action | Trait | undefined;
			keybind: Codes | undefined;
		},
		10
	>,
	5
>;

export type ActiveEffect = {
	effect: Effect;
	remaining: number;
	snapshot: State;
	onTick: () => void;
	// onExpire: () => void;
};

export type Resources = {
	mana: number;
	gauge: number;
	gauge2: number;
};

export type Target = {
	damageTaken: number;
	active: Record<string, ActiveEffect>;
};

export type State = {
	job: Job | Class;
	level: number;
	stats: Stats;

	// actionPools: Record<Job | Class, Record<string, Action>>;
	// effectPools: Record<Job | Class, Record<string, Effect>>;
	// traitPools: Record<Job | Class, Record<string, Trait>>;

	hotbars: Hotbar[];

	onCD: Record<string, number[]>;
	queued: Record<string, number>;
	active: Record<string, ActiveEffect>;
	history: ActionName[];
	combo?: string; // name of the action

	castingTimeout?: ReturnType<typeof setTimeout>;

	healingReceived: number; // in potency atm

	resources: Resources;

	GCD: number; // in s
	serverTick: number; // in ms
	otTick: number; // over-time tick, in ms

	target: Target;
};

type DamageModifier = {
	type: 'physical' | 'magical';
	flat: number;
	multPercent: number;
	addPercent: number;
	percentApplyOrder: 'multFirst' | 'addFirst';
	cdr: number;
};

export const defaultState: State = {
	job: Job.DRG_FFXIV,
	level: 80,
	stats: {
		damageModifiers: {
			flat: [],
			multPercent: [],
			addPercent: [],
			flags: ['multFirst', 'addFirst', 'applyOtherModsToFlat'],
			percentApplyOrder: 'multFirst',
		},
	},

	// actionPools: {},
	// effectPools: {},
	// traitPools: {},

	hotbars: [
		Array.from({ length: 5 }, () =>
			Array.from({ length: 10 }, () => ({
				action: undefined,
				keybind: undefined,
			}))
		) as Hotbar,
	],

	onCD: {},
	queued: {},
	active: {},
	history: [],
	combo: undefined,

	healingReceived: 0,

	resources: {
		mana: 0,
		gauge: 2,
		gauge2: 0,
	},

	GCD: 2.5,
	serverTick: 200,
	otTick: 3000,

	target: {
		damageTaken: 0,
		active: {},
	},
};

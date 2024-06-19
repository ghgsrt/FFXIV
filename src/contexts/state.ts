import { SetStoreFunction, createStore, produce } from 'solid-js/store';
import {
	ActiveEffect,
	Hotbar,
	Resources,
	State,
	defaultState,
} from '../types/Session';
import useServerTick from '../hooks/useServerTick';
import {
	Class,
	Classification,
	Job,
	associations,
} from '../lib/core/classification';
import {
	Accessor,
	batch,
	createEffect,
	createMemo,
	createRoot,
	createUniqueId,
	on,
} from 'solid-js';
import { LUT, LUTs, buildLUTs } from '../lib/core/LUTs';
import { CanCleanup, CleanupFn, useCleanup } from '../hooks/useCleanup';
import { Action, ActionName, ActionType } from '../lib/core/Action';
import { Effect, EffectName } from '../lib/core/Effect';
import { ExtraParameters, TailParameters } from '../types/utils';
import { deepCopy, newEmptyHotbar } from '../utils/utils';
import { Trait, TraitName } from '../lib/core/Trait';
import '../lib/core/Jobs/DRG/actions';
import '../lib/core/Jobs/DRG/effects';
import '../lib/core/Jobs/DRG/traits';
import '../lib/core/Classes/LNC/actions';
import '../lib/core/Classes/LNC/effects';
import '../lib/core/Classes/LNC/traits';
import '../lib/core/Roles/actions';
import '../lib/core/Roles/effects';
import '../lib/core/Roles/traits';
import { Codes, KeyCodes, Keys, KeysOrCodes } from '../types/KeyCodes';
import useInputs from '../hooks/useInputs';
import { isSettingKeybind } from '../components/overlay/hotbar/HotbarItem';
import { selectedTab } from '../components/overlay/Tabs';

type PoolName<T extends Action | Effect> = T extends Action
	? 'action'
	: 'effect';

type ItemName<
	T extends Action | Effect,
	C extends Classification
> = T extends Action ? ActionName<C> : EffectName<C>;

export type ItemNames<C extends Classification> =
	| ActionName<C>
	| EffectName<C>
	| TraitName<C>;

type CBName<T extends Action | Effect> = T extends Action
	? 'Use' | 'Combo'
	: 'Apply' | 'Tick' | 'Remove';

type AdjustActionProperty<C extends Classification = Classification> = <
	X extends keyof Action,
	Y extends keyof Action[X] | Action[X]
>(
	name: ActionName<C>,
	a: X,
	b: Y,
	c?: Y extends keyof Action[X] ? Action[X][Y] : undefined
) => (cleanupKey?: ItemNames<C>) => void;

type AdjustEffectProperty<C extends Classification = Classification> = <
	X extends keyof Effect,
	Y extends keyof Effect[X] | Effect[X]
>(
	name: EffectName<C>,
	a: X,
	b: Y,
	c?: Y extends keyof Effect[X] ? Effect[X][Y] : undefined
) => (cleanupKey?: ItemNames<C>) => void;

type RegisterCallback<
	T extends Action | Effect,
	C extends Classification,
	N extends ItemName<T, C> = ItemName<T, C>
> = (
	pool: PoolName<T>,
	name: N,
	on: CBName<T>,
	cb: (name: N) => void,
	key?: string
) => CleanupFn;

type InternalControllerValues<C extends Classification = Classification> = {
	actionPool: () => Record<ActionName<C>, Action<C>>;
	effectPool: () => Record<EffectName<C>, Effect<C>>;
	traitPool: () => Record<TraitName, Trait>;
	updateJob: (job: Job | Class | 'Role') => void;
	updateLevel: (level: number) => void;
	activateEffect: (
		effectName: EffectName<C>,
		options?: {
			onTarget?: boolean;
			useSnapshot?: boolean;
			conditional?: (snapshot: State) => boolean;
		}
	) => void;
	deactivateEffect: (effectName: EffectName<C>) => void;
	swapAction: (from: ActionName<C>, to: ActionName<C>) => CleanupFn;
	prevActionWas:
		| ((
				...names: ['Not' | ActionName<C>, ...ActionName<C>[]]
		  ) => (...args: any) => boolean) &
				((...name: undefined[]) => string | undefined);
	// <
	// 	N extends ['Not' | ActionName<C>, ...ActionName<C>[]] | undefined[]
	// >(
	// 	name: N
	// ) => N extends undefined[] ? string | undefined : (...args: any) => boolean;
	dealDamage: (snapshot: State) => (potency: number) => void;
	healDamage: (snapshot: State) => (potency: number) => void;
	deactivateEffectOnMelee: (effectName: EffectName<C>) => void;
	adjustActionProperty: AdjustActionProperty<C>;
	adjustEffectProperty: AdjustEffectProperty<C>;
	registerActionCallback: TailParameters<RegisterCallback<Action<C>, C>>;
	registerEffectCallback: TailParameters<RegisterCallback<Effect<C>, C>>;
	registerEffectTrigger: <A extends ActionName<C>, E extends EffectName<C>>(
		on: CBName<Action<C>>,
		actionName: A,
		effectName: E,
		conditional?: (snapshot: State) => boolean,
		extra?: (effectName: E) => void
	) => CleanupFn;
	pressAction: (action: Action<C>) => void;
	canUseAction: (action: Action<C>) => boolean;
	effectIsActive: (effectName: EffectName<C>) => boolean;

	ItemNames: ItemNames<C>;
};

export type ControllerValues<C extends Classification = Classification> = {
	updateJob: InternalControllerValues<C>['updateJob'];
	updateLevel: InternalControllerValues<C>['updateLevel'];
	effectIsActive: InternalControllerValues<C>['effectIsActive'];
	canUseAction: InternalControllerValues<C>['canUseAction'];
	prevActionWas: InternalControllerValues<C>['prevActionWas'];
	pressAction: InternalControllerValues<C>['pressAction'];
	activateEffect: InternalControllerValues<C>['activateEffect'];
	deactivateEffect: InternalControllerValues<C>['deactivateEffect'];
	dealDamage: ReturnType<InternalControllerValues<C>['dealDamage']>;
	healDamage: ReturnType<InternalControllerValues<C>['healDamage']>;
	adjustActionProperty: InternalControllerValues<C>['adjustActionProperty'];
	adjustEffectProperty: InternalControllerValues<C>['adjustEffectProperty'];
	swapAction: CanCleanup<
		InternalControllerValues<C>['swapAction'],
		ItemNames<C>
	>;
	registerActionCallback: CanCleanup<
		InternalControllerValues<C>['registerActionCallback'],
		ItemNames<C>
	>;
	registerEffectCallback: CanCleanup<
		InternalControllerValues<C>['registerEffectCallback'],
		ItemNames<C>
	>;
	registerEffectTrigger: CanCleanup<
		InternalControllerValues<C>['registerEffectTrigger'],
		ItemNames<C>
	>;
};

export type ControllerActionFns<C extends Classification = Classification> = {
	activateEffect: ControllerValues<C>['activateEffect'];
	deactivateEffect: ControllerValues<C>['deactivateEffect'];
};

export type ControllerEffectFns<C extends Classification = Classification> = {
	prevActionWas: ControllerValues<C>['prevActionWas'];
	swapAction: ControllerValues<C>['swapAction'];
	dealDamage: ControllerValues<C>['dealDamage'];
	healDamage: ControllerValues<C>['healDamage'];
};

export type ControllerTraitFns<C extends Classification = Classification> = {
	prevActionWas: ControllerValues<C>['prevActionWas'];
	swapAction: ControllerValues<C>['swapAction'];
	adjustActionProperty: ControllerValues<C>['adjustActionProperty'];
	adjustEffectProperty: ControllerValues<C>['adjustEffectProperty'];
	registerActionCallback: ControllerValues<C>['registerActionCallback'];
	registerEffectCallback: ControllerValues<C>['registerEffectCallback'];
	registerEffectTrigger: ControllerValues<C>['registerEffectTrigger'];
};

export type ControllerConditionals<C extends Classification = Classification> =
	{
		effectIsActive: ControllerValues<C>['effectIsActive'];
		canUseAction: ControllerValues<C>['canUseAction'];
	};

export type GetControllerFns<
	C extends Classification | 'Role',
	T extends Action<C> | Effect<C> | Trait<C>
> = ControllerValues<C>;
// C extends 'Role'
// 	? never
// 	: (T extends Action
// 			? // @ts-ignore -- ts too dumb
// 			  ControllerActionFns<C>
// 			: T extends Effect
// 			? // @ts-ignore -- ts too dumb
// 			  ControllerEffectFns<C>
// 			: // @ts-ignore -- ts too dumb
// 			  ControllerTraitFns<C>) &
// 			// @ts-ignore -- ts too dumb
// 			ControllerConditionals<C>;

export type PoolValues<C extends Classification = Classification> = {
	pools: {
		action: Action<C>[];
		effect: Effect<C>[];
		trait: Trait<C>[];
	};
	findAction: (name: string) => Action<C> | undefined;
};

export function useState() {
	// : [
	// 	State,
	// 	SetStoreFunction<State>,
	// 	ControllerValues,
	// 	PoolValues,
	// 	ReturnType<typeof useCleanup>
	// ]
	const [state, setState] = createStore({ ...defaultState, level: 0 });

	const cleaner = useCleanup<InternalControllerValues['ItemNames']>();
	const { listen } = useInputs();

	//? POOLS =========================================================================================================

	const getPool =
		<T extends Action | Effect | Trait>(pool: LUT<T>) =>
		(job?: Job | Class | 'Role', level?: number) => {
			const itemPool: T[] = [];

			for (const item of pool[job ?? state.job] || []) {
				if (!item.hasOwnProperty('level')) {
					itemPool.push(...pool[job ?? state.job]);
					break;
				}

				// @ts-ignore -- we already checked for level
				if (item.level <= (level ?? state.level)) itemPool.push(item);
				else break; //? since sorted, we can break
			}

			const [_role, _class] = associations[job ?? state.job];

			if (_class) {
				for (const item of pool[_class] || []) {
					if (!item.hasOwnProperty('level')) {
						itemPool.push(...pool[_class]);
						break;
					}

					// @ts-ignore -- we already checked for level
					if (item.level <= (level ?? state.level)) itemPool.push(item);
					else break; //? since sorted, we can break
				}
			}

			if (_role) {
				for (const item of pool['Role'] || []) {
					if (!item.job.includes(_role)) continue;

					if (!item.hasOwnProperty('level')) {
						itemPool.push(...pool['Role']);
						break;
					}

					// @ts-ignore -- we already checked for level
					if (item.level <= (level ?? state.level)) itemPool.push(item);
					else break; //? since sorted, we can break
				}
			}

			// @ts-ignore -- don't care, leave me alone ts
			return itemPool.sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
		};

	// const memoPool = <T extends Action | Effect | Trait>(pool: LUT<T>) =>
	// 	createMemo(getPool(pool)(state.level));

	// find item
	const byName =
		(name: string) =>
		<I extends { name: string }>(item: I) =>
			item.name === name;

	// const _actionPool = memoPool(LUTs.action);
	// const _effectPool = memoPool(LUTs.effect);
	// const _traitPool = memoPool(LUTs.trait);

	const [pools, setPools] = createStore({
		action: LUTs.action[state.job],
		effect: LUTs.effect[state.job],
		trait: LUTs.trait[state.job],
	});

	// const initHotbar = () => {
	// 	//? Temporary hotbar generation
	// 	console.log('hotbar', LUTs.action[state.job]);
	// 	const temp = [...pools.action];
	// 	const hotbar: State['hotbar'] = [];
	// 	for (let i = 0; i < 5; i++) {
	// 		hotbar.push([]);
	// 		for (let j = 0; j < 10; j++) {
	// 			hotbar[i].push({
	// 				action: temp.shift(),
	// 				keybind: undefined,
	// 			});
	// 		}
	// 	}

	// 	setState('hotbar', hotbar);
	// };

	// createEffect(() => {
	// 	// // @ts-ignore -- prevent solid from merging the new pool with the old one
	// 	// setPools('action', undefined);
	// 	// setPools('action', _actionPool());

	// 	//? Temporary hotbar generation
	// 	console.log('hotbar', LUTs.action[state.job]);
	// 	const temp = LUTs.action[state.job];
	// 	const hotbar: State['hotbar'] = [];
	// 	for (let i = 0; i < 5; i++) {
	// 		hotbar.push([]);
	// 		for (let j = 0; j < 10; j++) {
	// 			hotbar[i].push({
	// 				action: temp.shift(),
	// 				keybind: undefined,
	// 			});
	// 		}
	// 	}

	// 	setState('hotbar', hotbar);
	// });
	// createEffect(() => {
	// 	// @ts-ignore -- prevent solid from merging the new pool with the old one
	// 	setPools('effect', undefined);
	// 	setPools('effect', _effectPool());
	// });
	// let prevLevel = 0;

	const [hotbarCache, setHotbarCache] = createStore<
		Record<Job | Class, Record<string, Hotbar>>
	>(
		Object.fromEntries(
			Object.keys(associations).map((job) => [
				job,
				{
					'1': newEmptyHotbar(),
				},
			])
		) as unknown as Record<Job | Class, Record<string, Hotbar>>
	);

	const resetState = () => {
		batch(() => {
			setState('history', []);
			// @ts-ignore -- prevent solid from merging the new obj with the old one
			setState('onCD', undefined);
			setState('onCD', {});
			// @ts-ignore -- prevent solid from merging the new obj with the old one
			setState('queued', undefined);
			setState('queued', {});
			// @ts-ignore -- prevent solid from merging the new obj with the old one
			setState('active', undefined);
			setState('active', {});
			// @ts-ignore -- prevent solid from merging the new obj with the old one
			setState('target', 'active', undefined);
			setState('target', 'active', {});
			setState('resources', {
				mana: 0,
				gauge: 0,
				gauge2: 0,
			});
			setState('healingReceived', 0);
			setState('castingTimeout', undefined);
			setState('target', 'damageTaken', 0);
		});
	};

	const updateJob = (job: Job | Class) => _updateCore(job, state.level);
	const updateLevel = (level: number) => _updateCore(state.job, level);
	const _updateCore = (job: Job | Class, level: number) => {
		resetState();

		// @ts-ignore -- prevent solid from merging the new pool with the old one
		setPools('action', undefined);
		// setPools('action', LUTs.action[state.job]);
		setPools('action', getPool(LUTs.action)(job, level));
		// @ts-ignore -- prevent solid from merging the new pool with the old one
		setPools('effect', undefined);
		// setPools('effect', LUTs.effect[state.job]);
		setPools('effect', getPool(LUTs.effect)(job, level));
		// @ts-ignore -- prevent solid from merging the new pool with the old one
		setPools('trait', undefined);
		// setPools('trait', LUTs.trait[state.job]);
		setPools('trait', getPool(LUTs.trait)(job, level));

		// initHotbar();

		// const traitPool = Object.values(LUTs.trait);
		// setTimeout(() => {
		if (level !== state.level) {
			for (const trait of LUTs.trait[state.job] ?? []) {
				if (state.level < level) {
					if (trait.level > state.level && trait.level <= level)
						batch(() => trait.onAcquire(trait.name));
				} else if (state.level > level) {
					if (trait.level <= state.level && trait.level > level)
						batch(() => cleaner.cleanup(trait.name));
				} //? else didn't level up or down
			}
		}

		setState('job', job);
		setState('level', level);
	};

	//? SERVER PROCESSES ==============================================================================================

	const { tick, otTick, resetServerTick } = useServerTick(
		state.serverTick,
		state.otTick
	);

	const _tickEffect = (active: Record<string, ActiveEffect>) => {
		for (const key in active) {
			active[key].remaining -= state.serverTick / 1000;
			if (active[key].remaining <= 0) deactivateEffect(key as EffectName);
		}
	};

	createEffect(
		on(tick, () =>
			batch(() => {
				// handle CDs
				setState(
					'onCD',
					produce((onCD) => {
						for (const key in onCD) {
							// if (onCD[key].length > 1 && onCD[key][0] <= 0) onCD[key].shift();
							onCD[key][0] -= state.serverTick / 1000;
							// if (onCD[key].length === 1 && onCD[key][0] <= 0)
							if (onCD[key][0] <= 0) onCD[key].shift();
							if (onCD[key].length === 0) onCD[key] = undefined!;
						}
					})
				);
				// tick down active effect timers
				setState('active', produce(_tickEffect));
				setState('target', 'active', produce(_tickEffect));
			})
		)
	);

	// handle over-time effect ticks
	createEffect(
		on(otTick, () => {
			const active = state.target.active;
			for (const key in active) active[key].onTick();
		})
	);

	//? KEYBINDS ======================================================================================================

	const objectMap = <
		T extends string,
		K extends string,
		V,
		O extends 'key' | 'value' = 'key'
	>(
		obj: Record<K, T>,
		fn: (t: O extends 'key' ? K : T) => V,
		options?: { mapOn: O }
	) => {
		const res: Record<string, V> = {};
		for (const key in obj)
			res[key] = fn(
				(options?.mapOn === 'value'
					? obj[key]
					: key) as unknown as O extends 'key' ? K : T
			);
		return res as Record<K, V>;
	};

	const keymap = createMemo<Record<string, Record<Keys, Action | undefined>>>(
		() => {
			const map: any = {};

			for (const tab in hotbarCache[state.job]) {
				map[tab] = {};
				for (const row in hotbarCache[state.job][tab]) {
					for (const col in hotbarCache[state.job][tab][row]) {
						const keybind = hotbarCache[state.job][tab][row][col].keybind;
						if (keybind)
							map[tab][keybind] = hotbarCache[state.job][tab][row][col].item;
						// if (hotbarCache[state.job][tab][row][col].keybind === key)
						// 	return [Number(row), Number(col)] as [number, number];
					}
				}
			}

			return map;
		}
	);

	const keybind = (key: Keys) => (pressed: boolean) => {
		if (!pressed) return;
		if (isSettingKeybind()) return;
		// if (selectedTab.hotbar !== hotbarIdx) return;

		const action = keymap()[selectedTab.hotbar][key];
		if (!action) return;

		pressAction(action);
	};

	listen(
		{
			channels: {
				input: Object.keys(KeyCodes) as Keys[],
			},
			options: {
				use: 'key',
			},
		},
		{ keys: objectMap(KeyCodes, (key) => keybind(key)) }
	);

	//? CONTROLLER FUNCTIONS ==========================================================================================

	const effectIsActive: InternalControllerValues['effectIsActive'] = (name) =>
		!!state.active[name];

	const canUseAction: InternalControllerValues['canUseAction'] = (action) =>
		action.level <= state.level && action.condition();

	const swapAction: InternalControllerValues['swapAction'] = (from, to) => {
		const findItem =
			(name: string) =>
			(item: { action: Action | undefined; keybind: Codes | undefined }) =>
				item.action?.name === name;

		setState('hotbars', {}, findItem(from), {
			action: pools.action.find(byName(to)),
		});

		return () =>
			setState('hotbars', {}, findItem(to), {
				action: pools.action.find(byName(from)),
			});
	};

	function prevActionWas(
		...names: ['Not' | ActionName, ...ActionName[]]
	): (...args: any) => boolean;
	function prevActionWas(...name: undefined[]): string | undefined;
	function prevActionWas(
		...names: ['Not' | ActionName, ...ActionName[]] | undefined[]
	): ((...args: any) => boolean) | string | undefined {
		if (!names[0]) return state.history[state.history.length - 1];
		return (..._args) =>
			(names as ActionName[]).includes(
				state.history[state.history.length - 1]
			) ===
			(names[0] !== 'Not');
	}

	const _dealDamage = (snapshot?: State) => (potency: number) => {
		//! MODIFY DAMAGE USING SNAPSHOT IF EXIST ELSE STATE
		setState('target', 'damageTaken', (prev) => prev + potency);
	};
	function dealDamage(potency: number): void;
	function dealDamage(snapshot: State): (potency: number) => void;
	function dealDamage(param: any): any {
		if (typeof param === 'number') return _dealDamage()(param);
		else return _dealDamage(param);
	}
	const _healDamage = (snapshot?: State) => (potency: number) => {
		//! MODIFY HEALING USING SNAPSHOT IF EXIST ELSE STATE
		setState('healingReceived', (prev) => prev - potency);
	};
	function healDamage(potency: number): void;
	function healDamage(snapshot: State): (potency: number) => void;
	function healDamage(param: any): any {
		if (typeof param === 'number') return _healDamage()(param);
		else return _healDamage(param);
	}

	const _adjustProperty =
		<T extends Action | Effect>() =>
		<
			X extends keyof T,
			Y extends keyof T[X] | T[X],
			Z extends Y extends keyof T[X] ? T[X][Y] : undefined
		>(
			pool: 'action' | 'effect',
			name: ActionName | EffectName,
			a: X,
			b: Y,
			c?: Z
		): CleanupFn => {
			let prev: any;

			const findItem = byName(name);
			const cacheAndSet =
				<T>(_new: T) =>
				(_prev: T) => {
					prev = _prev;
					return _new;
				};

			if (c) {
				// @ts-ignore -- brain too smol
				setPools(pool, findItem, a, b, cacheAndSet(c));
				// @ts-ignore -- brain too smol
				return () => setPools(pool, findItem, a, b, prev);
			} else {
				// @ts-ignore -- brain too smol
				setPools(pool, findItem, a, cacheAndSet(b));
				// @ts-ignore -- brain too smol
				return () => setPools(pool, findItem, a, prev);
			}
		};
	const adjustActionProperty: InternalControllerValues['adjustActionProperty'] =
		(...args) => _adjustProperty<Action>()('action', ...args);
	const adjustEffectProperty: InternalControllerValues['adjustEffectProperty'] =
		(...args) => _adjustProperty<Effect>()('effect', ...args);

	// const _registerCallback =
	// 	<T extends 'action' | 'effect'>(
	// 		pool: T
	// 	) =>
	// 	((pool, name, on, cb, key): RegisterCallback<T extends 'action' ? Action : Effect, Classification> => {
	// 		key ??= createUniqueId();
	// 		const findItem = byName(name);

	// 		setPools(
	// 			pool,
	// 			findItem,
	// 			`on${on}Callbacks` as any,
	// 			key as any,
	// 			(_: () => void) => cb
	// 		);

	// 		return () =>
	// 			setPools(
	// 				pool,
	// 				findItem,
	// 				`on${on}Callbacks` as any,
	// 				key! as any,
	// 				undefined
	// 			);
	// }).bind(null, pool);
	const _registerCallback: RegisterCallback<Action | Effect, Classification> = (
		pool,
		name,
		on,
		cb,
		key
	) => {
		key ??= createUniqueId();
		const findItem = byName(name);

		setPools(
			pool,
			findItem,
			`on${on}Callbacks` as any,
			key as any,
			(_: () => void) => cb
		);

		return () =>
			setPools(
				pool,
				findItem,
				`on${on}Callbacks` as any,
				key! as any,
				undefined
			);
	};
	const registerActionCallback: InternalControllerValues['registerActionCallback'] =
		(...args) => _registerCallback('action', ...args);
	const registerEffectCallback: InternalControllerValues['registerEffectCallback'] =
		(...args) => _registerCallback('effect', ...args);

	const registerEffectTrigger: InternalControllerValues['registerEffectTrigger'] =
		(on, actionName, effectName, conditional, extra) =>
			registerActionCallback(actionName, on, () => {
				activateEffect(effectName, { conditional });
				if (extra?.call) extra(effectName);
			});

	const deactivateEffect: InternalControllerValues['deactivateEffect'] = (
		name
	) => {
		const effect = (state.active[name] ?? state.target.active[name])?.effect;

		effect.onExpire();
		for (const key in effect?.onExpireCallbacks ?? {})
			effect.onExpireCallbacks[key](name);

		cleaner.cleanup(name);

		batch(() => {
			setState('active', name, undefined!);
			setState('target', 'active', name, undefined!);
		});
	};

	const _activateEffect: ExtraParameters<
		InternalControllerValues['activateEffect'],
		[ExtraParameters<Effect['onTick'], [Effect]>]
	> = (name, options, onTick) => {
		if (options?.conditional?.call && !options.conditional(state)) return;

		const effect = pools.effect.find(byName(name))!;

		for (const key in effect.resourceCosts) {
			if (
				state.resources[key as keyof Resources] <
				effect.resourceCosts[key as keyof Resources]
			)
				return;
		}

		batch(() => {
			for (const key in effect.resourceCosts) {
				setState(
					'resources',
					key as keyof Resources,
					(prev) => prev - effect.resourceCosts[key as keyof Resources]
				);
			}
		});

		const activeEffect: ActiveEffect = {
			effect,
			remaining: effect.duration,
			snapshot: deepCopy(state),
			onTick: () =>
				batch(() => {
					onTick?.(effect);
					effect.onTick();
					for (const key in effect.onTickCallbacks)
						effect.onTickCallbacks[key](effect.name);
				}),
		};

		if (options?.onTarget) setState('target', 'active', name, activeEffect);
		else setState('active', name, activeEffect);

		batch(() => {
			effect.onApply(effect.name);
			for (const key in effect.onApplyCallbacks)
				effect.onApplyCallbacks[key](effect.name);
		});
	};

	//? FFXIV specific
	const activateEffect: InternalControllerValues['activateEffect'] = (
		name,
		options
	) =>
		_activateEffect(name, options, (effect) => {
			//! if ever want to add snapshotting, fix this
			dealDamage(effect.dotPotency);
			healDamage(effect.hotPotency);
		});

	const deactivateEffectsOnAction = (action: Action) => {
		const lastWasMelee =
			action.type === ActionType.WEAPON_SKILL && action.range === 3;

		for (const key in state.active) {
			const active = state.active[key as keyof typeof state.active];

			if (
				active.effect.deactivateOn === 'any' ||
				(active.effect.deactivateOn === 'melee' && lastWasMelee)
			)
				deactivateEffect(key as EffectName);
		}
	};

	const pressAction: InternalControllerValues['pressAction'] = (action) => {
		console.log(state.level);
		// if (action.name === 'noop') return;
		console.log(action);

		if (
			!(
				state.onCD[action.name]?.length === action.charges ||
				(action.recast === -1 && state.onCD.GCD)
			) &&
			action.condition()
		) {
			for (const key in action.resourceCosts) {
				if (
					action.resourceCosts[key as keyof Resources] >
					state.resources[key as keyof Resources]
				)
					return;
			}

			if (action.cast > 0) {
				setState(
					'castingTimeout',
					setTimeout(() => {
						setState('castingTimeout', undefined);
						fireAction(action);
					}, action.cast * 1000)
				);
			} else {
				console.log('firing action');
				fireAction(action);
			}
		}
	};

	const fireAction = (action: Action) => {
		batch(() => {
			for (const key in action.resourceCosts) {
				setState(
					'resources',
					key as keyof Resources,
					(prev) => prev - action.resourceCosts[key as keyof Resources]
				);
			}
			for (const key in action.resourceGains) {
				setState(
					'resources',
					key as keyof Resources,
					(prev) => prev + action.resourceGains[key as keyof Resources]
				);
			}

			if (action.recast === -1) setState('onCD', 'GCD', [state.GCD]);
			else if (action.sharedRecast)
				setState('onCD', action.sharedRecast, [action.recast]);
			else
				setState('onCD', action.name, (timers) => [
					...(timers ?? []),
					action.recast !== -1 ? action.recast : state.GCD,
				]);

			deactivateEffectsOnAction(action);

			if (action.breaksCombo) {
				if (!action.combos) setState('combo', action.name); // doesn't combo
				else if (state.combo && action.combos.includes(state.combo)) {
					// combos and is the next action in a combo
					setState('combo', action.name);
					dealDamage(action.comboPotency);
					action.onCombo(action.name);

					for (const key in action.onComboCallbacks)
						action.onComboCallbacks[key](action.name);

					return;
				} else setState('combo', undefined); // combos but not the next action (clear feed)
			}

			dealDamage(action.potency);
			action.onUse(action.name);

			for (const key in action.onUseCallbacks)
				action.onUseCallbacks[key](action.name);
		});

		setState('history', state.history.length, action.name);
	};

	return [
		state,
		setState,
		{
			updateJob,
			updateLevel,
			pressAction,
			canUseAction,
			effectIsActive,
			activateEffect,
			deactivateEffect,
			dealDamage,
			healDamage,
			adjustActionProperty: cleaner.allowCleanup(
				adjustActionProperty
			) as AdjustActionProperty,
			adjustEffectProperty: cleaner.allowCleanup(
				adjustEffectProperty
			) as AdjustEffectProperty,
			swapAction: cleaner.allowCleanup(swapAction),
			prevActionWas,
			registerActionCallback: cleaner.allowCleanup(registerActionCallback),
			registerEffectCallback: cleaner.allowCleanup(registerEffectCallback),
			registerEffectTrigger: cleaner.allowCleanup(registerEffectTrigger),
		},
		{
			pools,
			findAction: (name: ActionName) => pools.action?.find(byName(name)),
		},
		hotbarCache,
		setHotbarCache,
		cleaner,
	] as const;
}

export const [
	state,
	setState,
	controller,
	pools,
	hotbarCache,
	setHotbarCache,
	cleaner,
] = createRoot(useState);

buildLUTs(controller);

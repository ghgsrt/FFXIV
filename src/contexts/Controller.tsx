import {
	createContext,
	useContext,
	JSX,
	Component,
	batch,
	createEffect,
	on,
	createReaction,
} from 'solid-js';
import { useSession } from './SessionState';
import { Action, ActionType } from '../lib/core/Action';
import { NotWrappable, Part, produce } from 'solid-js/store';
import { ActiveEffect, Resources, State } from '../types/Session';
import { Effect } from '../lib/core/Effect';
import { deepCopy } from '../utils/utils';
import { createUniqueId } from 'solid-js';
import { EffectName } from '../types/Effect';
import { ActionName } from '../types/Action';
import {
	ExtraParameters,
	FilterKeysByValueType,
	Tail,
	TailParameters,
} from '../types/utils';
import { TraitName } from '../types/Trait';

type PoolName<T extends ActionName | EffectName> = T extends ActionName
	? 'actionPool'
	: 'effectPool';

type CleanupFn = () => void;

type Clean<T extends (...args: any) => CleanupFn> = (
	...args: Parameters<T>
) => void;

type ItemName<T extends 'actionPool' | 'effectPool'> = T extends 'actionPool'
	? ActionName
	: EffectName;

type CBName<T extends 'actionPool' | 'effectPool'> = T extends 'actionPool'
	? 'Use' | 'Combo'
	: 'Apply' | 'Tick' | 'Remove';

type FnSet<T extends 'actionPool' | 'effectPool'> = T extends 'actionPool'
	? ControllerActionFns
	: ControllerEffectFns;

type RegisterCallback<P extends 'actionPool' | 'effectPool'> = <T extends P>(
	pool: T,
	name: ItemName<T>,
	on: CBName<T>,
	cb: (fns: FnSet<T>) => void,
	key?: string
) => CleanupFn;

type Item<T extends ActionName | EffectName = ActionName & EffectName> =
	T extends ActionName ? Action : Effect;

type ItemKeys<T extends ActionName | EffectName> = T extends ActionName
	? keyof Action
	: keyof Effect;
// type AdjustableProperty<T extends ActionName | EffectName> = FilterKeysByValueType<

type ControllerFns = {
	activateEffect: (
		effectName: EffectName,
		options?: {
			onTarget?: boolean;
			useSnapshot?: boolean;
			conditional?: () => boolean;
		}
	) => void;
	deactivateEffect: (effectName: EffectName) => void;
	swapAction: (from: ActionName, to: ActionName) => CleanupFn;
	dealDamage: (snapshot: State) => (potency: number) => void;
	healDamage: (snapshot: State) => (potency: number) => void;
	deactivateEffectOnMelee: (effectName: EffectName) => void;
	adjustProperty: <
		N extends ActionName | EffectName,
		P extends ItemKeys<N>,
		V extends State[PoolName<N>][N][keyof State[PoolName<N>][N]] | number 
	>(
		name: N,
		property: P,
		value: V
	) => CleanupFn;
	registerActionCallback: TailParameters<RegisterCallback<'actionPool'>>;
	registerEffectCallback: TailParameters<RegisterCallback<'effectPool'>>;
	registerEffectTrigger: (
		registerActionCallback: Clean<ControllerFns['registerActionCallback']>
	) => (
		on: CBName<'actionPool'>,
		actionName: ActionName,
		effectName: EffectName,
		conditional?: () => boolean,
		extra?: () => void
	) => CleanupFn;
	effectIsActive: (effectName: EffectName) => boolean;
	pressAction: (action: Action) => void;
	canUseAction: (action: Action) => boolean;
};

export type ControllerActionFns = {
	activateEffect: ControllerFns['activateEffect'];
	deactivateEffect: ControllerFns['deactivateEffect'];
};

export type ControllerEffectFns = {
	swapAction: Clean<ControllerFns['swapAction']>;
	dealDamage: ReturnType<ControllerFns['dealDamage']>;
	healDamage: ReturnType<ControllerFns['healDamage']>;
	deactivateEffectOnMelee: () => void;
};

export type ControllerTraitFns = {
	swapAction: Clean<ControllerFns['swapAction']>;
	adjustProperty: Clean<ControllerFns['adjustProperty']>;
	registerActionCallback: Clean<ControllerFns['registerActionCallback']>;
	registerEffectTrigger: Clean<
		ReturnType<ControllerFns['registerEffectTrigger']>
	>;
};

export type ControllerConditionals = {
	effectIsActive: ControllerFns['effectIsActive'];
};

type Props = {
	children: JSX.Element | JSX.Element[];
};

const ControllerContext = createContext<ControllerFns>();

const ControllerProvider: Component<Props> = (props) => {
	const { state, setState, tick, otTick } = useSession()!;

	const __cleanupFns: Record<string, CleanupFn[]> = {};
	const __onCleanup = (key: string, fn: CleanupFn) => {
		(__cleanupFns[key] ??= []).push(fn);
	};
	const __cleanup = (key: string) => {
		//! CLEARING __cleanupFns[key] BEFORE THE LOOP IS
		//! NECESSARY OTHERWISE SOME WEIRD ASS VOODOO
		//! CALL STACK BULLSHIT WILL BREAK EVERYTHING
		const temp = __cleanupFns[key] ?? [];
		__cleanupFns[key] = [];

		batch(() => {
			for (const fn of temp) fn();
		});
	};

	const __autoCleanup =
		<T extends (...args: any) => CleanupFn>(key: string, fn: T): Clean<T> =>
		(...args) =>
			__onCleanup(key, fn(...(args as []), key)); //! make sure the cast didn't break stuff somehow

	const __batchAutoCleanup = <
		T extends Record<string, (...args: any) => CleanupFn>
	>(
		key: string,
		fns: T
	) => {
		const _fns: any = {};

		for (const fnName in fns) _fns[fnName] = __autoCleanup(key, fns[fnName]);

		return _fns as {
			[K in keyof T]: Clean<T[K]>;
		};
	};

	const __createHistoryReaction = (condition: () => boolean) =>
		setTimeout(() => {
			const track = createReaction(() => {
				if (!condition()) track(() => state.history[state.history.length]);
			});

			track(() => state.history[state.history.length]);
		}, 0);

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

	// const adjustProperty: ControllerFns['adjustProperty'] = (
	// 	name,
	// 	property,
	// 	value
	// ) => {
	// 	const pool = state.actionPool[name]?.hasOwnProperty(property)
	// 		? 'actionPool'
	// 		: 'effectPool';

	// 	const swapVals = value instanceof Number;
	// 	let temp: any;

	// 	setState(pool, name, property as keyof Action & keyof Effect, (prev) => {
	// 		if (swapVals) {
	// 			temp = prev;
	// 			return value;
	// 		}

	// 		return (prev as number) + (value as number);
	// 	});

	// 	return () =>
	// 		setState(pool, name, property as any, (prev: any) => {
	// 			if (swapVals) return temp;
	// 			return prev - (value as number);
	// 		});
	// };

	const adjustProperty: ControllerFns['adjustProperty'] = (
		name,
		property,
		value
	) => {
		const pool = state.actionPool[name]?.hasOwnProperty(property)
			? 'actionPool'
			: 'effectPool';

		const swapVals = value instanceof Number;
		let temp: any;

		setState(pool, name, property as keyof Action & keyof Effect, (prev) => {
			if (swapVals) {
				temp = prev;
				return value;
			}

			return ((prev as unknown as number) + (value as number)) as any;
		});

		return () =>
			setState(pool, name, property as keyof Action & keyof Effect, (prev) => {
				if (swapVals) return temp;
				return ((prev as unknown as number) - (value as number)) as any;
			});
	};
	// const test = adjustProperty('Battle Litany', 'onComboCallbacks', );

	const swapAction: ControllerFns['swapAction'] = (from, to) => {
		setState('hotbar', from, 'actionName', to);

		return () => setState('hotbar', from, 'actionName', from);
	};

	const _registerCallback: RegisterCallback<'actionPool' | 'effectPool'> = (
		pool,
		name,
		on,
		cb,
		key
	) => {
		key ??= createUniqueId();

		setState(
			pool,
			name as any,
			`on${on}Callbacks` as any,
			key as any,
			(_: (fns: ControllerActionFns | ControllerEffectFns) => void) => cb
		);

		return () =>
			setState(
				pool,
				name as any,
				`on${on}Callbacks` as any,
				key! as any,
				undefined
			);
	};

	const registerActionCallback: ControllerFns['registerActionCallback'] = (
		...args
	) => _registerCallback('actionPool', ...args);
	const registerEffectCallback: ControllerFns['registerEffectCallback'] = (
		...args
	) => _registerCallback('effectPool', ...args);

	const registerEffectTrigger: ControllerFns['registerEffectTrigger'] =
		(_registerActionCallback) =>
		(on, actionName, effectName, conditional, extra) => {
			_registerActionCallback(actionName, on, (actionController) => {
				actionController.activateEffect(effectName, { conditional });
				if (extra?.call) extra();
			});

			return () => deactivateEffect(effectName);
		};

	const deactivateEffectOnMelee: ControllerFns['deactivateEffectOnMelee'] = (
		name
	) => {
		__createHistoryReaction(() => {
			const lastAction =
				state.actionPool[state.history[state.history.length - 1]];
			if (
				lastAction.type === ActionType.WEAPON_SKILL &&
				lastAction.range === 3
			) {
				deactivateEffect(name);
				return true;
			}

			return false;
		});
	};

	const __activateAction = (): ControllerActionFns => ({
		activateEffect,
		deactivateEffect,
	});

	const __activateEffect = (
		key: EffectName,
		snapshot: State
	): ControllerEffectFns => ({
		dealDamage: dealDamage(snapshot),
		healDamage: healDamage(snapshot),
		deactivateEffectOnMelee: () => deactivateEffectOnMelee(key),
		swapAction: __autoCleanup(key, swapAction),
	});

	const __activateTrait = (key: TraitName): ControllerTraitFns => {
		const _registerActionCallback = __autoCleanup(key, registerActionCallback);

		return {
			registerActionCallback: _registerActionCallback,
			adjustProperty: __autoCleanup(key, adjustProperty),
			...__batchAutoCleanup(key, {
				swapAction,
				registerEffectCallback,
				registerEffectTrigger: registerEffectTrigger(_registerActionCallback),
			}),
		};
	};

	const deactivateEffect: ControllerFns['deactivateEffect'] = (name) => {
		(state.active[name] ?? state.target.active[name])?.onExpire();

		__cleanup(name);

		batch(() => {
			setState('active', name, undefined!);
			setState('target', 'active', name, undefined!);
		});
	};

	const _activateEffect: ExtraParameters<
		ControllerFns['activateEffect'],
		[ExtraParameters<Effect['onTick'], [Effect]>]
	> = (name, options, onTick) => {
		if (options?.conditional?.call && !options.conditional()) return;

		const effect = state.effectPool[name];

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

		const effectFns = __activateEffect(
			name,
			options?.useSnapshot ? deepCopy(state) : undefined
		);

		const activeEffect: ActiveEffect = {
			effect,
			remaining: effect.duration,
			onTick: () =>
				batch(() => {
					onTick?.(effectFns, effect);
					effect.onTick(effectFns);
				}),
			onExpire: () => batch(() => effect.onExpire(effectFns)),
		};

		if (options?.onTarget) setState('target', 'active', name, activeEffect);
		else setState('active', name, activeEffect);

		batch(() => effect.onApply(effectFns));
	};

	//? FFXIV specific
	const activateEffect: ControllerFns['activateEffect'] = (name, options) =>
		_activateEffect(name, options, (effectFns, effect) => {
			effectFns.dealDamage(effect.dotPotency);
			effectFns.healDamage(effect.hotPotency);
		});

	const effectIsActive: ControllerFns['effectIsActive'] = (name) =>
		!!state.active[name];

	const canUseAction: ControllerFns['canUseAction'] = (action) =>
		action.level > state.level || action.condition({ effectIsActive });

	const pressAction: ControllerFns['pressAction'] = (action) => {
		if (
			!(
				state.onCD[action.name]?.length === action.charges ||
				(action.recast === -1 && state.onCD.GCD)
			) &&
			action.condition({ effectIsActive })
		) {
			for (const key in action.resourceCosts) {
				if (
					action.resourceCosts[key as keyof Resources] <=
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
			} else fireAction(action);
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

			setState('history', state.history.length, action.name);

			if (action.breaksCombo) {
				if (!action.combos) setState('combo', action.name); // doesn't combo
				else if (state.combo && action.combos.includes(state.combo)) {
					// combos and is the next action in a combo
					setState('combo', action.name);
					dealDamage(action.comboPotency);
					action.onCombo(__activateAction());

					for (const key in action.onComboCallbacks)
						action.onComboCallbacks[key](__activateAction());

					return;
				} else setState('combo', undefined); // combos but not the next action (clear feed)
			}

			dealDamage(action.potency);
			action.onUse(__activateAction());

			for (const key in action.onUseCallbacks)
				action.onUseCallbacks[key](__activateAction());
		});
	};

	const _tickEffect = (active: Record<string, ActiveEffect>) => {
		for (const key in active) {
			active[key].remaining -= state.serverTick / 1000;
			if (active[key].remaining <= 0) deactivateEffect(key as EffectName);
		}
	};
	//? Handle server tick processes
	createEffect(
		on(tick, () =>
			batch(() => {
				// handle CDs
				setState(
					'onCD',
					produce((onCD) => {
						for (const key in onCD) {
							onCD[key][0] -= state.serverTick / 1000;
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

	createEffect<number>((prevLevel) => {
		//! Doesn't appear to be working
		for (const traitName in state.traitPool) {
			const traitLevel = state.traitPool[traitName].level;

			if (prevLevel < state.level) {
				// level up
				if (traitLevel > prevLevel && traitLevel <= state.level)
					// prevLevel < traitLevel <= state.level
					batch(() =>
						state.traitPool[traitName].onAcquire(
							__activateTrait(traitName as TraitName),
							state
						)
					);
			} else if (prevLevel > state.level)
				if (traitLevel <= prevLevel && traitLevel > state.level)
					// level down
					// prevLevel >= traitLevel > state.level
					__cleanup(traitName);
		}

		return state.level;
	}, 0);

	const context: ControllerFns = {
		activateEffect,
		deactivateEffect,
		dealDamage,
		healDamage,
		swapAction,
		deactivateEffectOnMelee,
		adjustProperty,
		registerActionCallback,
		registerEffectCallback,
		registerEffectTrigger,
		effectIsActive,
		pressAction,
		canUseAction,
	};
	return (
		<ControllerContext.Provider value={context}>
			{props.children}
		</ControllerContext.Provider>
	);
};

export default ControllerProvider;

export function useController() {
	return useContext(ControllerContext);
}

import { Trait } from './Trait';
import { Class, Classification, Job } from './classification';
import { Action } from './Action';
import { Effect } from './Effect';
import { OmitDefaults } from '../../types/utils';
import { mergeDefaults } from '../../utils/utils';
import { createStore } from 'solid-js/store';
import { ControllerValues, GetControllerFns } from '../../contexts/state';
export type LUT<T extends Action | Effect | Trait> = Record<
	Job | Class | 'Role',
	T[]
>;

export const [LUTs, setLUTs] = createStore({
	action: {} as LUT<Action>,
	effect: {} as LUT<Effect>,
	trait: {} as LUT<Trait>,
});

const definedItems: ((controller: ControllerValues) => void)[] = [];

//! this is so fucking cursed, I hope to God I never have to touch it again
type StoT<
	S,
	C extends Classification | 'Role' = Classification
> = S extends 'action' ? Action<C> : S extends 'effect' ? Effect<C> : Trait<C>;
export const defineItems =
	<
		S extends 'action' | 'effect' | 'trait',
		D extends Partial<_T>,
		_T extends Action | Effect | Trait = StoT<S>
	>(
		type: S,
		defaultProps?: D
	) =>
	<
		C extends Job | Class | 'Role',
		T extends Action<C> | Effect<C> | Trait<C> = StoT<S, C>,
		// @ts-ignore
		_R extends OmitDefaults<T, keyof D> = OmitDefaults<T, keyof D>
	>(
		classification: C,
		items: (
			fns: GetControllerFns<C, T>
		) => Omit<C extends 'Role' ? _R : Omit<_R, 'job'>, 'itemType'>[]
	) =>
		definedItems.push((controller: ControllerValues) => {
			const itemList = items(controller as unknown as GetControllerFns<C, T>); //? narrowing visibility

			const newItems = itemList.map((item) => ({
				// @ts-ignore -- job is only specified for roles as they may include more than one classification
				job: classification,
				// @ts-ignore
				...mergeDefaults<T>()(defaultProps)(item),
				itemType: type,
			}));

			setLUTs(type, (prev) => ({
				...prev,
				[classification]: newItems as unknown as T[],
			}));
		});

export const buildLUTs = (controller: ControllerValues) =>
	definedItems.forEach((item) => item(controller));

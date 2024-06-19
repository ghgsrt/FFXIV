import { Classification, Job, Role } from './classification';
import { DRGTraitName } from './Jobs/DRG/traits';
import { RoleTraitName } from './Roles/traits';
import { LNCTraitName } from './Classes/LNC/traits';
import { defineItems } from './LUTs';

export type Trait<C extends Classification | 'Role' = Classification> = {
	itemType: 'trait';
	job: C extends 'Role' ? Role[] : C;
	name: TraitName<C>;
	img: string;
	description: string;
	level: number;
	onAcquire: (name: TraitName<C>) => void;
	// onRemove?: (controller: ControllerTraitFns, state: State) => void;
};

const defaultTraitProps = {
	description: '',
	img: '', // [name-of-the-trait].png, (don't add the ext.)
	level: 0,
	onAcquire: () => {},
} as const satisfies Partial<Trait>;

export const defineTraits = defineItems('trait', defaultTraitProps);

export type TraitName<T extends Classification | 'Role' = Classification> =
	T extends [] | Role | 'Role'
		? RoleTraitName
		: T extends Job.DRG_FFXIV
		? DRGTraitName | LNCTraitName
		: never;

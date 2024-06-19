import { createRoot, createSignal } from 'solid-js';
import { ActionLUT, EffectLUT, LUT, TraitLUT } from './lib/core/LUTs';
import { Action } from './lib/core/Action';
import { Effect } from './lib/core/Effect';
import { Trait } from './lib/core/Trait';

function useGlobalStore() {
	const [actionLUT, setActionLUT] = createSignal<LUT<Action>>(ActionLUT);
	const [effectLUT, setEffectLUT] = createSignal<LUT<Effect>>(EffectLUT);
	const [traitLUT, setTraitLUT] = createSignal<LUT<Trait>>(TraitLUT);

	return {
		actionLUT,
		setActionLUT,
		effectLUT,
		setEffectLUT,
		traitLUT,
		setTraitLUT,
	};
}

export default createRoot(useGlobalStore);

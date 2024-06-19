import { defineTraits } from '../../Trait';
import { Class } from '../../classification';

const names = [] as const;
export type LNCTraitName = (typeof names)[number];

export const LNCTraits = defineTraits(Class.LNC_FFXIV, () => []);

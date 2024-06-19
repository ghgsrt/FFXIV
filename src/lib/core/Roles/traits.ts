import { defineTraits } from '../Trait';

const names = [] satisfies string[];
export type RoleTraitName = (typeof names)[number];

export const RoleTraits = defineTraits('Role', () => []);

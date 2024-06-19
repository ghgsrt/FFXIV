import { defineEffects } from '../Effect';

const names = [] satisfies string[];
export type RoleEffectName = (typeof names)[number];

export const RoleEffects = defineEffects('Role', () => []);

import { levelMods } from '../modifiers/level';

const critRate = (level: number, critStat: number) =>
	Math.floor(
		(200 * (critStat - levelMods[level].SUB)) / levelMods[level].DIV + 50
	) / 1000;

const critBuff = (level: number, critStat: number) =>
	(1400 +
		Math.floor(
			(200 * (critStat - levelMods[level].SUB)) / levelMods[level].DIV
		)) /
	1000;

const dhRate = (level: number, dhStat: number) =>
	Math.floor(
		(550 * (dhStat - levelMods[level].SUB)) / levelMods[level].DIV + 550
	) / 1000;

const dhBuff = 0.25;

const detBuff = (level: number, detStat: number) =>
	Math.floor(
		(140 * (detStat - levelMods[level].SUB)) / levelMods[level].DIV + 1000
	) / 1000;

//! NOTE: doesn't account for haste, also just ensure these make sense in game
//! Auto Attack, DoT, and HoT
const spdBuff = (level: number, spdStat: number) =>
	Math.floor(
		(130 * (spdStat - levelMods[level].SUB)) / levelMods[level].DIV + 1000
	) / 1000;

//! Time in ms !!!
//! Weaponskill and Spell Cast and GCD Reduction (no haste buffs)
const spdReduction = (level: number, spdStat: number, time: number) =>
	Math.floor(
		(time *
			Math.ceil(
				(130 * (spdStat - levelMods[level].SUB)) / levelMods[level].DIV + 1000
			)) /
			10000
	) / 100;

//! Tank only
// tenacity: outgoing damage & healing buff
const tncOutBuff = (level: number, tncStat: number) =>
	(1000 +
		Math.floor(
			(100 * (tncStat - levelMods[level].SUB)) / levelMods[level].DIV
		)) /
	1000;

//! Tank only
// tenacity: incoming damage mitigation
const tncInMit = (level: number, tncStat: number) =>
	(1000 -
		Math.floor(
			(100 * (tncStat - levelMods[level].SUB)) / levelMods[level].DIV
		)) /
	1000;

//! Healer only
// piety: increases the passive MP recovered with the personal recovery tick
const pieBuff = (level: number, pieStat: number) =>
	Math.floor((150 * (pieStat - levelMods[level].SUB)) / levelMods[level].DIV);

//! Physical and Magical damage only
//! defense mitigation stacks multiplicatively w/ other mitigations
const defMit = (level: number, defStat: number) =>
	100 - Math.floor((15 * defStat) / levelMods[level].DIV) / 100;

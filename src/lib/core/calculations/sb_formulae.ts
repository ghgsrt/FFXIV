import { Class, Job } from '../classification';
import { jobMods } from '../modifiers/job';
import { levelMods } from '../modifiers/level';
import { clanMods } from '../modifiers/race';

const getAttr = (
	attr: 'STR' | 'DEX' | 'VIT' | 'INT' | 'MND',
	level: number,
	job: Job | Class,
	clan: keyof typeof clanMods
) =>
	Math.floor(levelMods[level].MAIN * (jobMods[job][attr] / 100)) +
	clanMods[clan][attr]; //! + Traits

const getHP = (
	isTank: boolean,
	level: number,
	job: Job | Class,
	clan: keyof typeof clanMods
) =>
	Math.floor(levelMods[level].HP * (jobMods[job].HP / 100)) +
	Math.floor(
		(getAttr('VIT', level, job, clan) - levelMods[level].MAIN) *
			(isTank ? 31.5 : 22.1)
	);

const mpActionRec = (potency: number) => potency / 10;

const mpTickRec = (level: number, piety?: number) =>
	(piety
		? Math.floor((150 * (piety - levelMods[level].MAIN)) / levelMods[level].DIV)
		: 0) + 200;

import { Stats } from '../../types/Session';
import { Job, Class, associations } from './classification';
import globalTables from '../../global';
import { Action } from './Action';
import { Effect } from './Effect';
import { Trait } from './Trait';

type Props = {
	job: Job | Class;
	level: number;
	stats: Stats;
};

// const StateConfig = ({ job, level, stats }: Props) => {
// 	const { actionLUT, effectLUT, traitLUT } = globalTables;

// 	const getPool = (table: Record<string, Action | Effect | Trait>) => {
// 		Object.values(table).filter(
// 			(item) => item.job === job || associations[job].includes(item.job)
// 		);
// 	};

// 	const actionPool = getPool(actionLUT());
// 	const effectPool = getPool(effectLUT());
// 	const traitPool = getPool(traitLUT());
// };

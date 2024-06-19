import {
	createContext,
	useContext,
	JSX,
	Component,
	Accessor,
	batch,
	createEffect,
	on,
} from 'solid-js';
import {
	SetStoreFunction,
	createStore,
	produce,
	reconcile,
} from 'solid-js/store';
import { ActiveEffect, State, defaultState } from '../types/Session';
import useServerTick from '../hooks/useServerTick';
import globalTables from '../global';
import { HotbarConfig } from '../components/overlay/hotbar/Hotbar';
import { Job, associations } from '../lib/core/classification';
import { Action } from '../lib/core/Action';
import { Effect } from '../lib/core/Effect';
import { Trait } from '../lib/core/Trait';

type Props = {
	children: JSX.Element | JSX.Element[];
	config?: State;
};

export type SessionValues = {
	state: State;
	setState: SetStoreFunction<State>;
	tick: Accessor<number>;
	otTick: Accessor<number>;
	resetServerTick: () => void;
};

const SessionContext = createContext<SessionValues>();

const SessionProvider: Component<Props> = (props) => {
	const [state, setState] = createStore<SessionValues['state']>(defaultState);
	if (props.config) setState(reconcile(props.config)); //! make sure this actually works as intended

	const { tick, otTick, resetServerTick } = useServerTick(
		state.serverTick,
		state.otTick
	);
	const { actionLUT, effectLUT, traitLUT } = globalTables; // receive items from all tables

	// collect all items in a given table that are available to the current job
	const getPool = <T extends Action | Effect | Trait>(
		table: Record<string, T>
	) => {
		const pool: typeof table = {};

		for (const key in table) {
			const item = table[key];
			// it was either make this janky and require the associations object, or
			// have to use arrays for the job property of every item and manually populate it
			// which honestly is probably the better option and requires <= work but I'm lazy?
			// idk something feels more idiomatic this way to me for some reason...
			if (
				item.job === state.job || // job specific
				associations[state.job].includes(item.job) || // class/role specific
				associations[state.job].some((job) => item.job?.includes(job)) // job/class/role specific when item.job is an array
			)
				pool[key] = item;
		}

		return pool;
	};

	createEffect(() => {
		setState('actionPool', getPool(actionLUT()));

		//? Temporary hotbar generation
		let row = 0;
		let col = 0;
		const hotbar: HotbarConfig = {};
		Object.values(state.actionPool).forEach((action, i) => {
			if (i % 6 === 0) {
				row++;
				col = 0;
			}

			hotbar[action.name] = {
				row,
				col: col++,
				actionName: action.name,
				keybind: '!',
			};
		});
		setState('hotbar', hotbar);
	});
	createEffect(() => {
		setState('effectPool', getPool(effectLUT()));
	});
	createEffect(() => {
		setState('traitPool', getPool(traitLUT()));
	});

	const context: SessionValues = {
		state,
		setState,
		tick,
		otTick,
		resetServerTick,
	};
	return (
		<SessionContext.Provider value={context}>
			{props.children}
		</SessionContext.Provider>
	);
};

export default SessionProvider;

export function useSession() {
	return useContext(SessionContext);
}

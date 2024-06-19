import { createSignal } from 'solid-js';
import { Tuple } from '../types/utils';

export interface Response {
	message: string;
	key: string;
	channelHead: string;
	from?: string;
	extra?: Record<string, any>;
}
// export type Response = StateObject<ResponseProps>;
interface RequiredStateObjectProps {
	message: string;
	key: string;
	channelHead: string;
	from?: string;
}
export type StateObject = Record<string, any> & RequiredStateObjectProps;
export interface State<T extends StateObject> {
	state: T;
	sharedState: Record<string, any>;
}

export type StateManagerFnProps<P extends StateObject = StateObject> = Tuple<
	State<P>,
	4
>;
export type StateManagerConfig<C, P extends StateObject, R> = Partial<
	Record<keyof C, (...props: StateManagerFnProps<P>) => R>
>;

function useStateManager<T extends StateObject>(channels: string[]) {
	const { state, prevState, changeState } = useStateMachine();

	const stateMachines: Record<
		string,
		ReturnType<typeof useStateMachine<T>>
	> = {};
	for (const channel of channels)
		stateMachines[channel] = useStateMachine<T>();

	return {
		state,
		prevState,
		stateMachines,
		changeState,
	};
}

const defState: Record<'state' | 'sharedState', any> = {
	state: {},
	sharedState: {},
};
export function useStateMachine<T extends StateObject>() {
	const [prevState, setPrevState] = createSignal<State<T>>(defState);
	const [state, setState] = createSignal<State<T>>(defState);

	const changeState = (newState: T) => {
		setPrevState((_) => state());
		setState((_) => ({
			state: newState,
			sharedState: state()?.sharedState ?? {},
		}));
	};

	return {
		prevState,
		state,
		changeState,
	};
}

export default useStateManager;

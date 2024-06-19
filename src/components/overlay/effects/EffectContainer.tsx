import { Component, For } from 'solid-js';
import ActiveEffect from './ActiveEffect';

import styles from './ActiveEffect.module.css';
import { state } from '../../../contexts/state';

type Props = {
	useTarget: boolean;
};

const EffectContainer: Component<Props> = ({ useTarget }) => {
	// const { state } = useSession()!;

	return (
		<div class={styles.container}>
			<For each={Object.values((useTarget ? state.target : state).active)}>
				{(active) => <ActiveEffect effect={active.effect} />}
			</For>
		</div>
	);
};

export default EffectContainer;

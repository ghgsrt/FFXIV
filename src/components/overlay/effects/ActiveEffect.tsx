import { Component } from 'solid-js';
import { Effect } from '../../../lib/core/Effect';
import { useSession } from '../../../contexts/SessionState';

import styles from './ActiveEffect.module.css';
import { state } from '../../../contexts/state';

type Props = {
	effect: Effect;
};

const ActiveEffect: Component<Props> = ({ effect }) => {
	// const { state } = useSession()!;

	return (
		<div class={styles.effect}>
			<img
				class={styles.icon}
				src={`icons/${effect.img || effect.name}.png`}
				alt={effect.name}
				width='40'
				height='40'
			/>
			<p class={styles.counter}>
				{Math.ceil(
					(state.active[effect.name] ?? state.target.active[effect.name])
						?.remaining
				) || ''}
			</p>
		</div>
	);
};

export default ActiveEffect;

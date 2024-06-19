import { Component, For } from 'solid-js';
import globalTables from '../../global';

import styles from './Heuristics.module.css';
import { controller, pools, setState, state } from '../../contexts/state';
import { Class, Job, associations } from '../../lib/core/classification';

const Heuristics: Component = () => {
	return (
		<aside class={styles.heuristics}>
			<select
				onChange={(e) => controller.updateJob(e.currentTarget.value as Job | Class)}
				style={{ background: 'none' }}
			>
				<For each={Object.keys(associations)}>
					{(job) => (
						<option selected={state.job === job} value={job}>
							{job}
						</option>
					)}
				</For>
			</select>
			<input
				type='number'
				value={''}
				placeholder={state.level.toString()}
				style={{ color: 'black' }}
				onInput={(e) => {
					controller.updateLevel(parseInt(e.currentTarget.value));
				}}
			/>
			<h3>Gauge</h3>
			<p>{state.resources.gauge}</p>
			<h3>Gauge 2</h3>
			<p>{state.resources.gauge2}</p>
			<h3>Potency Dealt</h3>
			<p>{state.target.damageTaken}</p>
			<h3>Combo</h3>
			<p>{state.combo ?? 'None'}</p>
			<h3>Cooldowns</h3>
			<For each={Object.keys(state.onCD)}>
				{(key) => (
					<>
						<p class={styles.item}>
							{pools.findAction(key)?.name ?? 'GCD'}:{' '}
							{state.onCD[key][0].toFixed(1)}
						</p>
					</>
				)}
			</For>
			<hr />
			<h3>History</h3>
			<div class={styles.history}>
				<For each={[...state.history].reverse()}>
					{(actionName) => (
						<img
							src={`icons/${
								pools.findAction(actionName)?.img ||
								pools.findAction(actionName)?.name
							}.png`}
							alt={pools.findAction(actionName)?.name}
						/>
					)}
				</For>
			</div>
		</aside>
	);
};

export default Heuristics;

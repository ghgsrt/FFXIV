import {
	createMemo,
	type Component,
	createEffect,
	on,
	onMount,
} from 'solid-js';

import styles from './App.module.css';
import Heuristics from './components/heuristics/Heuristics';
import Hotbar from './components/overlay/hotbar/Hotbar';
import EffectContainer from './components/overlay/effects/EffectContainer';
import './lib/core/Action';
import './lib/core/Effect';
import './lib/core/factory';
import './lib/core/LUTs';
import Spellbook from './components/overlay/hotbar/Spellbook';
import TabBody, {
	TabBar,
	setSelectedTab,
	tabs,
} from './components/overlay/Tabs';
import ControlPanel from './components/controlPanel/ControlPanel';
import Tooltip from './components/overlay/tooltip/Tooltip';
import { hotbarCache, setHotbarCache, state } from './contexts/state';
import { newEmptyHotbar } from './utils/utils';

const App: Component = () => {
	const hotbarTabs = createMemo(() => {
		const _tabs: any = {};
		for (const key in hotbarCache[state.job]) _tabs[key] = <Hotbar idx={key} />;

		return _tabs;
	});

	onMount(() => {
		createEffect(
			on(
				() => state.job,
				() => {
					setSelectedTab('hotbar', tabs.hotbar[0].name);
				}
			)
		);
	});

	return (
		<main class={styles.main}>
			<section
				style={{
					background: 'green',
				}}
			>
				<ControlPanel />
			</section>
			<section
				class={styles.section}
				style={{
					width: '20%',
				}}
			>
				<div
					style={{
						flex: '1',
						background: 'blue',
					}}
				>
					<TabBar key='character' />
					<TabBody
						key='character'
						tabs={{
							Spellbook: <Spellbook />,
							Armory: <div />, // gear and stats
							'Skill Tree': <div />, // trees/talents
						}}
					/>
				</div>
				<div
					style={{
						background: 'yellow',
					}}
				>
					<Tooltip />
				</div>
			</section>
			<section class={styles.section}>
				<div
					style={{
						flex: '1',
						background: 'red',
					}}
				>
				</div>
				<div style={{
					height: '15%',
				}}>
					Active Traits
				</div>
				<div
					style={{
						background: 'purple',
						height: '30%',
						display: 'flex',
						'flex-direction': 'column',
						'justify-content': 'start',
					}}
				>
					<h2>Target</h2>
					<div
						style={{
							height: '40%',
						}}
					>
						<EffectContainer useTarget={true} />
					</div>
					<h2>Self</h2>
					<div>
						<EffectContainer useTarget={false} />
					</div>
				</div>
				<div
					style={{
						background: 'orange',
					}}
				>
					<div
						style={{
							display: 'flex',
							'flex-direction': 'row',
							'justify-content': 'space-between',
							'padding-right': '0.75rem',
						}}
					>
						<TabBar key='hotbar' />
						<button
							onClick={() => {
								const name = Object.keys(hotbarCache[state.job]).length + 1;
								setHotbarCache(state.job, name.toString(), newEmptyHotbar());
							}}
							style={{
								background: 'none',
							}}
						>
							<p>+</p>
						</button>
					</div>
					<div>
						<TabBody key='hotbar' tabs={hotbarTabs()} />
					</div>
				</div>
			</section>
			<section
				style={{
					background: 'pink',
				}}
			>
				<Heuristics />
			</section>
		</main>
	);
};

export default App;

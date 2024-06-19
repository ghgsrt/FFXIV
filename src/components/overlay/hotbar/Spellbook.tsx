import { Component, For, createMemo } from 'solid-js';
import Item from './HotbarItem';
// import { noopAction } from '../../../lib/core/Action';

import styles from './Hotbar.module.css';
import { state, pools } from '../../../contexts/state';
import { createStore } from 'solid-js/store';
import { chunkArray } from '../../../utils/utils';
import { Action } from '../../../lib/core/Action';
import { Job, Class } from '../../../lib/core/classification';

type SpellbookOptions = {
	groupBy: 'job' | 'category';
};

const Spellbook: Component = () => {
	const [options, setOptions] = createStore<SpellbookOptions>({
		groupBy: 'job',
	});

	const spellbook = createMemo(() => {
		const _spellbook: any = {};

		for (const action of pools.pools.action ?? []) {
			const group = Array.isArray(action[options.groupBy])
				? 'Role'
				: (action[options.groupBy] as Job | Class);
			_spellbook[group] = [...(_spellbook[group] ?? []), action];
		}

		for (const header in _spellbook)
			_spellbook[header] = chunkArray(_spellbook[header], 7);

		return _spellbook as Record<string, Action[][]>;
	});

	return (
		<section
			class={styles.hotbar}
			style={{
				margin: '0',
				width: 'min-content',
				'align-items': 'start',
			}}
		>
			<For each={Object.keys(spellbook() || [])}>
				{(header) => (
					<>
						<h3>{header.split('_')[0]}</h3>
						<For each={spellbook()[header]}>
							{(row) => (
								<div class={styles.row}>
									<For each={row}>
										{(item) => (
											<Item
												keybind={undefined}
												item={item}
												itemType="action"
												isPermanent={true}
												noKeybind={true}
											/>
										)}
									</For>
								</div>
							)}
						</For>
					</>
				)}
			</For>
		</section>
	);
};

export default Spellbook;

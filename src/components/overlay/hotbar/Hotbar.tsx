import { Component, For, createEffect } from 'solid-js';
import Item from './HotbarItem';
// import { noopAction } from '../../../lib/core/Action';

import styles from './Hotbar.module.css';
import { hotbarCache, state } from '../../../contexts/state';
import { selectedTab } from '../Tabs';

type Props = {
	idx: string;
};

const Hotbar: Component<Props> = (props) => {
	return (
		<section class={styles.hotbar}>
			<For each={hotbarCache[state.job][props.idx]}>
				{(row, r) => (
					<div class={styles.row}>
						<For each={row}>
							{(item, i) => (
								<Item
									keybind={item.keybind}
									item={item.item}
									hotbarIdx={props.idx}
									row={r()}
									col={i()}
								/>
							)}
						</For>
					</div>
				)}
			</For>
		</section>
	);
};

export default Hotbar;

import { Component, createSignal } from 'solid-js';
import styles from './Tooltip.module.css';
import { Action } from '../../../lib/core/Action';
import { Trait } from '../../../lib/core/Trait';

type TooltipItem = Action | Trait;

const processDescription = (item: TooltipItem) => {
	return item.description;
};

const [hoveredItem, setHoveredItem] = createSignal<TooltipItem | undefined>(
	undefined
);
export const showTooltip = (item: TooltipItem) => setHoveredItem(item);
export const hideTooltip = () => setHoveredItem(undefined);

type Props = {};
const Tooltip: Component<Props> = () => {
	return (
		<section class={styles['tooltip']}>
			<h1>Tooltip</h1>
		</section>
	);
};

export default Tooltip;

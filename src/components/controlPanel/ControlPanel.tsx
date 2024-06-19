import { Component } from 'solid-js';
import styles from './ControlPanel.module.css';

type Props = {};

const ControlPanel: Component<Props> = () => {
	return (
		<section class={styles['control-panel']}>
			<h1>Control Panel</h1>
		</section>
	);
};

export default ControlPanel;

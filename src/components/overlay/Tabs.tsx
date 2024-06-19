import {
	Accessor,
	Component,
	For,
	JSX,
	Match,
	Show,
	Switch,
	createEffect,
	createMemo,
	on,
	onMount,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { hotbarCache, setHotbarCache, state } from '../../contexts/state';
import { newEmptyHotbar } from '../../utils/utils';

type Tab = {
	name: string;
	component: JSX.Element;
	isSelected: Accessor<boolean>;
	select: () => void;
};

export const [tabs, setTabs] = createStore<Record<string, Tab[]>>({});
export const [selectedTab, setSelectedTab] = createStore<
	Record<string, string>
>({});

type Props = {
	key: string;
	tabs: Record<string, JSX.Element>;
};
const TabBody: Component<Props> = (props) => {
	createEffect(() => {
		const _tabs: any = [];
		for (const tabName in props.tabs) {
			_tabs.push({
				name: tabName,
				component: props.tabs[tabName],
				isSelected: createMemo(() => tabName === selectedTab[props.key]),
				select: () => setSelectedTab(props.key, tabName),
			});
		}

		setTabs(props.key, _tabs);
	});

	onMount(() => {
		setSelectedTab(props.key, tabs[props.key][0].name);
	});

	return (
		<Switch>
			<For each={tabs[props.key]}>
				{(tab) => <Match when={tab.isSelected()}>{tab.component}</Match>}
			</For>
		</Switch>
	);
};

type TabBarProps = {
	key: string;
};
export const TabBar: Component<TabBarProps> = (props) => {
	return (
		<div
			style={{
				display: 'flex',
				'flex-direction': 'row',
				'justify-content': 'start',
				height: 'fit-content',
				padding: '0 0.75rem',
			}}
		>
			<For each={tabs[props.key]}>
				{(tab) => (
					<div
						onClick={tab.select}
						style={{
							'margin-right': '1rem',
						}}
					>
						<p>{tab.name}</p>
						<Show when={tab.isSelected()}>
							<hr
								style={{
									border: '3px solid red',
									margin: '0',
									width: '100%',
									height: '3px',
								}}
							/>
						</Show>
					</div>
				)}
			</For>
		</div>
	);
};

export default TabBody;

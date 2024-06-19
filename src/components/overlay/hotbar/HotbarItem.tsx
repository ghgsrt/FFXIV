import {
	Component,
	Show,
	batch,
	createEffect,
	createSignal,
	on,
	onMount,
} from 'solid-js';
import { Action } from '../../../lib/core/Action';
import { Codes } from '../../../types/KeyCodes';
import {
	controller,
	hotbarCache,
	setHotbarCache,
	setState,
	state,
} from '../../../contexts/state';

import styles from './Hotbar.module.css';
import { selectedTab } from '../Tabs';
import { showTooltip } from '../tooltip/Tooltip';
import { Trait } from '../../../lib/core/Trait';
import { clamp } from '../../../utils/utils';

type Props = {
	keybind?: Codes;
	item?: Action | Trait;
	hotbarIdx: string;
	row: number;
	col: number;
	isPermanent?: boolean;
	noKeybind?: boolean;
};

export const [isSettingKeybind, setIsSettingKeybind] = createSignal(false);

const HotbarItem: Component<Props> = (props) => {
	let btnRef: HTMLButtonElement;
	let timerRef: SVGCircleElement[] = [];

	const [dragging, setDragging] = createSignal<[number, number] | undefined>(
		undefined
	);

	const [timerCirc, setTimerCirc] = createSignal(100);
	const [progressPerTick, setProgressPerTick] = createSignal(0);
	const [progress, setProgress] = createSignal(0);

	onMount(() => {
		createEffect(() => {
			if (props.item?.itemType !== 'action') return;

			setTimerCirc(2 * Math.PI * timerRef?.[0]?.r.baseVal.value ?? 0);

			setProgressPerTick(
				(timerCirc() /
					(props.item?.recast === -1 ? state.GCD : props.item?.recast ?? 0)) *
					(state.serverTick / 1000)
			);
		});
		// createEffect(() => setProgress(timerCirc()))

		// createEffect(() => {
		// 	if (props.item?.itemType !== 'action') return;
		// 	if (!timerRef[0] || !timerRef[1]) return;

		// 	const progress = clamp(
		// 		0,
		// 		timerCirc() -
		// 			(((props.item?.recast === -1
		// 				? state.onCD.GCD?.[0]
		// 				: state.onCD[props.item?.name ?? '']?.[0]) ?? timerCirc()) /
		// 				(props.item?.recast === -1 ? state.GCD : props.item?.recast ?? 1)) *
		// 				timerCirc() +
		// 			progressPerTick(),
		// 		timerCirc()
		// 	);

		// 	if (progress <= timerCirc()) {
		// 		timerRef[0].style.display = 'block';
		// 		timerRef[1].style.display = 'block';
		// 	} else {
		// 		timerRef[0].style.display = 'none';
		// 		timerRef[1].style.display = 'none';
		// 	}

		// 	setProgress(progress);
		// });

		// createEffect(() => console.log(progress()));

		createEffect(
			on(
				() =>
					props.item?.itemType === 'action'
						? props.item?.recast === -1
							? state.onCD.GCD?.[0]
							: state.onCD[props.item?.name ?? '']?.[0]
						: undefined,
				(cur, _prev) => {
					if (props.item?.itemType !== 'action') return;
					if (!timerRef[0] || !timerRef[1]) return;

					if (cur === undefined) {
						timerRef[0].style.display = 'none';
						timerRef[1].style.display = 'none';
						console.log('doob');
						setProgress(0);
					} else {
						if (
							props.item?.recast === -1 ||
							!(
								(state.onCD[props.item!.name]?.length ?? 0) <
								props.item!.charges
							)
						)
							timerRef[0].style.display = 'block';
						else timerRef[0].style.display = 'none';
						timerRef[1].style.display = 'block';

						if (_prev !== undefined) {
							if (cur < state.serverTick / 1000)
								setProgress(
									(prev) => prev + (timerCirc() - (prev % timerCirc()))
								);
							else setProgress((prev) => prev + progressPerTick());
						}
					}
				}
			)
		);

		createEffect(() => {
			if (props.item?.itemType !== 'action') return;

			if (props.item && state.onCD[props.item.name]) {
				btnRef.classList.add(styles.onCD);

				if (state.onCD[props.item!.name].length < props.item!.charges)
					btnRef.classList.add(styles['has-charges']);
				else btnRef.classList.remove(styles['has-charges']);
			} else if (props.item?.recast === -1 && state.onCD.GCD) {
				btnRef.classList.add(styles.onCD);
			} else {
				btnRef.classList.remove(styles.onCD);
			}
		});
	});

	return (
		<>
			<div
				data-row={props.row}
				data-col={props.col}
				class={styles['item-wrapper']}
				// classList={{
				// 	[styles['no-pointer']]:
				// 		dragging()?.[0] === item.row && dragging()?.[1] === item.col,
				// }}
				onMouseEnter={() => props.item && showTooltip(props.item)}
				draggable={!!props.item && props.item?.itemType !== 'trait'}
				onDrag={() => setDragging([props.row!, props.col!])}
				onDragEnd={(e) => {
					let hovered: [string, number, number] | undefined = undefined;
					const temp = document.elementFromPoint(
						e.clientX,
						e.clientY
					) as HTMLElement | null;
					if (temp && (temp.draggable || temp.tagName === 'BUTTON')) {
						hovered = [
							temp.getAttribute('data-hotbar-idx')!,
							parseInt(temp.getAttribute('data-row')!),
							parseInt(temp.getAttribute('data-col')!),
						];
					}

					if (hovered) {
						// const [r1, i1] = dragging()!;
						const [idx, r2, i2] = hovered!;
						const from = props.item;
						const to = hotbarCache[state.job][idx]?.[r2]?.[i2].item;

						batch(() => {
							if (!props.isPermanent) {
								//? prevent solid from merging the objects
								setHotbarCache(
									state.job,
									props.hotbarIdx,
									props.row,
									props.col,
									'item',
									undefined
								);
								setHotbarCache(
									state.job,
									props.hotbarIdx,
									props.row,
									props.col,
									'item',
									to && { ...to }
								);
							}

							if (Number.isInteger(r2)) {
								//? prevent solid from merging the objects
								setHotbarCache(state.job, idx, r2, i2, 'item', undefined);
								setHotbarCache(
									state.job,
									idx,
									r2,
									i2,
									'item',
									from && { ...from }
								);
							}
						});
					} else if (!props.isPermanent) {
						// const [r1, i1] = dragging()!;
						setHotbarCache(
							state.job,
							selectedTab.hotbar,
							props.row,
							props.col,
							'item',
							undefined
						);
					}

					setDragging(undefined);
				}}
			>
				<button
					ref={btnRef}
					data-hotbar-idx={props.hotbarIdx}
					data-row={props.row}
					data-col={props.col}
					class={`
						${styles.item}
						${
							props.item &&
							props.item?.itemType === 'action' &&
							!controller.canUseAction(props.item!) &&
							styles.disabled
						}
						${
							state.combo &&
							props.item?.itemType === 'action' &&
							props.item?.combos?.includes(state.combo) &&
							styles.combo
						}`}
					onClick={() => {
						if (props.item && props.item?.itemType === 'action')
							setTimeout(() => controller.pressAction(props.item! as Action));
					}}
				>
					<Show when={!!props.item}>
						<div class={styles.icon}>
							<img
								src={`icons/${props.item?.img || props.item?.name}.png`}
								alt={props.item?.name}
								width='40'
								height='40'
							/>

							<svg
								class={styles.timer}
								width={timerCirc()}
								height={timerCirc()}
								viewBox='0 0 100 100'
							>
								<circle
									ref={timerRef[0]}
									cx='50'
									cy='50'
									r='35'
									stroke='#111d'
									stroke-width='70'
									stroke-linecap='butt'
									stroke-dasharray={`${timerCirc()}`}
									stroke-dashoffset={progress()}
									style={{
										transition:
											progress() !== 0
												? `stroke-dashoffset ${state.serverTick}ms linear`
												: '',
										display: 'none',
									}}
								/>
								<circle
									ref={timerRef[1]}
									cx='50'
									cy='50'
									r='35'
									stroke='red'
									stroke-width='70'
									stroke-linecap='butt'
									stroke-dasharray={`5 ${timerCirc() - 5}`}
									stroke-dashoffset={progress()}
									style={{
										transition:
											progress() !== 0
												? `stroke-dashoffset ${state.serverTick}ms linear`
												: '',
										display: 'none',
									}}
								/>
							</svg>
							<p class={styles.counter}>
								{Math.ceil(props.item ? state.onCD[props.item.name]?.[0] : 0) ||
									''}
							</p>
						</div>
					</Show>
				</button>
				<Show when={!props.noKeybind}>
					<input
						type='text'
						value={props.keybind ?? ''}
						onFocus={() => setIsSettingKeybind(true)}
						onBlur={(e) => {
							batch(() => {
								setHotbarCache(
									state.job,
									props.hotbarIdx,
									{},
									(item) => item.keybind === e.currentTarget.value,
									'keybind',
									undefined
								);
								setHotbarCache(
									state.job,
									props.hotbarIdx,
									props.row!,
									props.col!,
									'keybind',
									e.currentTarget.value as Codes
								);

								setIsSettingKeybind(false);
							});
						}}
					/>
				</Show>
			</div>
			{/* )} */}
		</>
	);
};

export default HotbarItem;

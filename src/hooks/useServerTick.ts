import { createEffect, createSignal, onCleanup } from 'solid-js';

const useServerTick = (tickRate = 200, otTickRate = 3000) => {
	const [tick, setTick] = createSignal(0);
	const [otTick, setOtTick] = createSignal(0);

	createEffect(() => {
		const interval = setInterval(() => {
			setTick((tick) => tick + 1);
		}, tickRate);

		onCleanup(() => clearInterval(interval));
	});

	createEffect(() => {
		if (
			otTickRate <= tickRate ||
			tick() % Math.trunc(otTickRate / tickRate) === 0
		) {
			setOtTick((tick) => tick + 1);
		}
	});

	const resetServerTick = () => {
		setTick(0);
		setOtTick(0);
	};

	return { tick, otTick, resetServerTick };
};

export default useServerTick;

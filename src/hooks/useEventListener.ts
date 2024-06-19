import { onMount, onCleanup } from 'solid-js';

function useEventListener(
	event: string,
	callback: EventListenerOrEventListenerObject,
	auto = true
) {
	const subscribe = (options = false) =>
		window.addEventListener(event, callback, options);
	const unsubscribe = (options = false) =>
		window.removeEventListener(event, callback, options);

	if (auto) {
		onMount(subscribe);
		onCleanup(unsubscribe);
	}

	return { subscribe, unsubscribe };
}

export default useEventListener;

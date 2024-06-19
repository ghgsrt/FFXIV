import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { Codes, KeysOrCodes } from '../types/KeyCodes';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import useStateManager, {
	Response,
	StateManagerConfig,
	StateManagerFnProps,
	StateObject,
} from './useStateManager';

export type Channels<T = string> = Record<string, T[]>;
export type InputChannels<T extends KeysOrCodes> = Record<
	string,
	T[] | Channels<T>
>;
export interface InputOptions {
	use: 'key' | 'code';
}
export interface InputConfig<T extends KeysOrCodes> {
	channels: InputChannels<T>;
	options: InputOptions;
}

export type KeyFn<R> = (pressed: boolean) => R | void;
export type ChannelFn<R> = (key: string, head: string) => R | string | void;
// export type PostFire<R> = Record<'_post', (result?: R) => void>;
export interface KeybindOptions {
	alwaysPassInput?: boolean;
	useModsChannel?: boolean;
}
export interface KeybindConfig<
	KT extends KeysOrCodes = Codes, //? key names
	CT extends Record<string, any> = InputChannels<KT>, //? channel names
	PR = string, //? post fire fn params type / state manager fn return type
	R = Response //? key/channel fn return type if using state manager
> {
	keys: Partial<Record<KT, KeyFn<PR>>>;
	channels?: Partial<Record<keyof CT, ChannelFn<R>>>; // & PostFire<PR>;
	post?: (result?: PR) => void;
	options?: KeybindOptions;
}

export interface Output {
	channels: Channels;
	pressed: string[];
}

//! SHOULD I TREAT NO CAPS AND CAPS THE EXACT SAME WHEN USE KEY????????
function useInputs<
	KT extends KeysOrCodes,
	PR = string,
	R extends StateObject = Response
>(
	keybindConfig?: KeybindConfig<KT, InputChannels<KT>, PR, R>,
	stateManagerConfig?: StateManagerConfig<InputChannels<KT>, R, PR>
) {
	const [_keybindConfig, setKeybindConfig] =
		createSignal<typeof keybindConfig>(keybindConfig);

	const [_stateManagerConfig, setStateManagerConfig] =
		createSignal<typeof stateManagerConfig>(stateManagerConfig);
	const [stateManager, setStateManager] = createStore(useStateManager([]));

	const [inputConfig, setInputConfig] = createSignal<InputConfig<KT>>({
		channels: {},
		options: { use: 'code' },
	});
	const [output, setOutput] = createStore<Output>({
		channels: {},
		pressed: [],
	});
	const unsubList: (() => void)[] = [];

	createEffect(() => {
		if (inputConfig())
			setStateManager(useStateManager(Object.keys(inputConfig().channels)));
	});

	const firePost = (_result?: R | PR, channel?: string) => {
		let result = _result;
		if (_stateManagerConfig() && _result && channel) {
			const stateMachine = stateManager.stateMachines[channel];

			const props = [
				stateMachine.state(),
				stateMachine.prevState(),
				stateManager.state(),
				stateManager.prevState(),
			] as StateManagerFnProps<R>;

			result = (_stateManagerConfig()![channel]?.(...props) ??
				(result as R).message) as PR;

			stateManager.changeState(_result as R);
			stateMachine.changeState(_result as R);
		}

		if (typeof result !== 'string') result = (result as R).message as PR;

		_keybindConfig()?.post?.(result as PR);
	};

	const callKeybind = (key: string, pressed: boolean) => {
		if (!_keybindConfig()) return;

		let res = (_keybindConfig()!.keys as Record<string, KeyFn<PR>>)?.[key]?.(
			pressed
		);

		if (res !== undefined) firePost(res);
	};
	const callChannelKeybind = (channel: string, key: string): void => {
		if (!_keybindConfig() || !channel) return;

		let res = _keybindConfig()!.channels?.[channel]?.(
			key,
			output.channels[channel][0]
		);
		if (res === 'no-op') return;

		if (channel === 'mods' && !_keybindConfig()!.options?.useModsChannel)
			return callChannelKeybind(res as string, key);

		if (res === undefined || typeof res === 'string')
			res = {
				message: res ?? channel,
				key,
				channelHead: output.channels[channel][0],
			} as R;

		firePost(res, channel);
	};

	const addChannel = (channel: string) => {
		setOutput('channels', (channels) => ({ ...channels, [channel]: [] }));
	};
	const pushToChannel = (channel: string, key: string) => {
		setOutput('channels', channel, (channel) => [key, ...channel]);

		callChannelKeybind(channel, key);
	};
	const removeFromChannel = (channel: string, key: string) => {
		setOutput(
			'channels',
			channel,
			produce((channel) => {
				const idxToRemove = channel.lastIndexOf(key);
				if (idxToRemove > -1) channel.splice(idxToRemove, 1);
			})
		);

		callChannelKeybind(channel, key);
		if (output.pressed.length === 0)
			firePost({ message: 'toDefault', from: 'useInputs' } as R, channel);
	};
	const clearOutputChannels = () => {
		setOutput('channels', {});
		unsubList.forEach((unsub) => unsub());
	};

	const pressKey = (key: string) => {
		setOutput(
			'pressed',
			produce((keys) => {
				keys.unshift(key);
			})
		);

		callKeybind(key, true);
	};
	const releaseKey = (key: string) => {
		setOutput(
			'pressed',
			produce((keys) => {
				const idxToRemove = keys.indexOf(key);
				if (idxToRemove > -1) keys.splice(idxToRemove, 1);
			})
		);

		callKeybind(key, false);
	};

	const listen = (
		inputConfig: InputConfig<KT>,
		keybindConfig?: KeybindConfig<KT, typeof inputConfig.channels, PR, R>,
		stateManagerConfig?: StateManagerConfig<typeof inputConfig.channels, R, PR>
	) => {
		setInputConfig(inputConfig);
		if (keybindConfig) setKeybindConfig(() => keybindConfig);
		if (stateManagerConfig) setStateManagerConfig(() => stateManagerConfig);

		clearOutputChannels();

		const inputChannels = inputConfig.channels;
		const keyType = inputConfig.options.use;

		const keyToChannel: Record<string, Set<string>> = {};
		const keyToVal: Record<string, Record<string, Set<string>>> = {};

		const addToMaps = (input: KT, channel: string, key?: string) => {
			(keyToChannel[input] ??= new Set()).add(channel);
			((keyToVal[input] ??= {})[channel] ??= new Set()).add(key ?? input);
		};

		for (const channel in inputChannels) {
			addChannel(channel);

			for (const key in inputChannels[channel]) {
				if (Array.isArray(inputChannels[channel])) {
					addToMaps((inputChannels[channel] as KT[])[parseInt(key)], channel);
				} else {
					(inputChannels[channel] as Channels<KT>)[key].forEach((input) =>
						addToMaps(input, channel, key)
					);
				}
			}
		}

		const determineValue = (e: Event) => {
			const key = (e as KeyboardEvent)[keyType];

			return {
				key,
				channels: keyToChannel[key],
				values: keyToVal[key],
				shouldReturn: !keyToChannel[key],
			};
		};

		const mutOutChannels = (
			callback: typeof pushToChannel,
			channels: Set<string>,
			values: Record<string, Set<string>>
		) => {
			channels.forEach((channel) =>
				values[channel].forEach((value) => callback(channel, value))
			);
		};

		const handleKeyDown = (e: Event) => {
			const { key, channels, values, shouldReturn } = determineValue(e);

			if (shouldReturn || output.pressed.includes(key)) return;
			if (document.activeElement?.tagName !== 'INPUT') e.preventDefault();

			pressKey(key);
			mutOutChannels(pushToChannel, channels, values);
		};

		const handleKeyUp = (e: Event) => {
			const { key, channels, values, shouldReturn } = determineValue(e);

			if (shouldReturn || !output.pressed.includes(key)) return;
			e.preventDefault();

			releaseKey(key);
			mutOutChannels(removeFromChannel, channels, values);
		};

		unsubList.push(useEventListener('keydown', handleKeyDown).unsubscribe);
		unsubList.push(useEventListener('keyup', handleKeyUp).unsubscribe);
	};

	onCleanup(() => unsubList.forEach((unsub) => unsub()));

	return { output, listen, setKeybindConfig };
}

export default useInputs;

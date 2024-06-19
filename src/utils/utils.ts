import { createUniqueId } from 'solid-js';
import { Hotbar } from '../types/Session';

export const deepCopy = (obj: Record<string, any>) =>
	JSON.parse(JSON.stringify(obj));

// export const deepMerge = <T extends Record<string, any>>(
// 	target: T,
// 	source: Partial<T>
// ) => {
// 	for (let key in target) {
// 		if (source[key] === undefined) continue;

// 		if ((source[key] as any) instanceof Object)
// 			target[key] = deepMerge(target[key], source[key]!);
// 		else target[key] = source[key]!;
// 	}

// 	return target;
// };
export const deepMerge = <T extends Record<string, any>>(
	target: T,
	source: Partial<T>
) => {
	if (!target) return source;
	for (let key in source) {
		// if (source[key] === undefined) continue;

		if ((source[key] as any) instanceof Object) {
			// target[key] ??= {};

			//@ts-ignore -- typescript sucks balls
			target[key] = deepMerge(target[key], source[key]!);
		} else target[key] = source[key]!;
	}

	return target;
};

export const mergeDefaults =
	<T>() =>
	<D extends Partial<T>>(defaultProps?: D) => {
		const defFns: Record<string, any> = {};

		if (defaultProps)
			for (const key in defaultProps)
				if (typeof defaultProps[key] === 'function')
					defFns[key] = defaultProps[key];

		return (props: Omit<T, keyof D>) => {
			const fns: Record<string, any> = {};

			// @ts-ignore
			for (const key in props)
				if (typeof props[key] === 'function') fns[key] = props[key];

			return {
				...defFns,
				...fns,
				id: createUniqueId(),
				...deepMerge(deepCopy(defaultProps ?? {}), deepCopy(props)),
			} as T;
		};
	};

export function chunkArray<T>(array: T[], chunkSize: number) {
	const chunkedArr = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunkedArr.push(array.slice(i, i + chunkSize));
	}
	return chunkedArr;
}

export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const clamp = (min: number, value: number, max: number) =>
	Math.min(Math.max(value, min), max);

export const newEmptyHotbar = () =>
	Array.from({ length: 5 }, () =>
		Array.from({ length: 10 }, () => ({
			action: undefined,
			keybind: undefined,
		}))
	) as Hotbar;

const itPrototype = Object.getPrototypeOf(
	Object.getPrototypeOf([][Symbol.iterator]())
);
export const toRecallIter = (
	iterOrIterable: Array<string> | IterableIterator<string>
) => {
	const _iter =
		Symbol.iterator in iterOrIterable
			? iterOrIterable[Symbol.iterator]()
			: iterOrIterable;

	const iter = Object.create(itPrototype);

	let current: string;
	let prev: string;
	let done: boolean | undefined;
	let idx = 0;

	return {
		...iter,
		next() {
			const { value, done: _done } = _iter.next();
			if (value !== undefined) idx++;
			prev = current;
			current = value;
			done = _done;
			return value;
		},
		get current() {
			return current;
		},
		get prev() {
			return prev;
		},
		get done() {
			return done;
		},
		get index() {
			return idx;
		},
	} as {
		next(): string;
		get current(): string;
		get prev(): string;
		get done(): boolean | undefined;
		get index(): number;
	};
};

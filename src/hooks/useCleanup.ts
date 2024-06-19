import { batch } from 'solid-js';
import { ItemNames } from '../contexts/state';

export type CleanupFn = () => void;

export type Clean<T extends (...args: any) => CleanupFn> = (
	...args: Parameters<T>
) => void;

export type CanCleanup<
	F extends (...args: any) => CleanupFn,
	K extends string
> = (...args: Parameters<F>) => (cleanupKey: K) => void;

export function useCleanup<K extends string>() {
	const cleanupFns: Record<string, CleanupFn[]> = {};
	const push = (key: string, fn: CleanupFn) =>
		(cleanupFns[key] ??= []).push(fn);

	const cleanup = (key: string) => {
		//! CLEARING __cleanupFns[key] BEFORE THE LOOP IS
		//! NECESSARY OTHERWISE SOME WEIRD ASS VOODOO
		//! CALL STACK BULLSHIT WILL BREAK EVERYTHING
		const temp = cleanupFns[key] ?? [];
		cleanupFns[key] = [];

		batch(() => {
			for (const fn of temp) fn();
		});
	};

	const queue =
		<T extends (...args: any) => CleanupFn>(key: K, fn: T): Clean<T> =>
		(...args) =>
			push(key, fn(...(args as []), key)); //! make sure the cast didn't break stuff somehow

	const batchQueue = <T extends Record<string, (...args: any) => CleanupFn>>(
		key: K,
		fns: T
	) => {
		const _fns: any = {};

		for (const fnName in fns) _fns[fnName] = queue(key, fns[fnName]);

		return _fns as {
			[K in keyof T]: Clean<T[K]>;
		};
	};

	const allowCleanup = <F extends (...args: any) => CleanupFn>(
		cleanableFn: F
	): CanCleanup<F, K> => {
		return (...args) => {
			// @ts-ignore -- it's literally being collected above, wtf
			return (key) => push(key, cleanableFn(...args));
		};
	};

	const batchPush =
		<
			T extends ReturnType<ReturnType<typeof allowCleanup>>,
			// K extends T extends (key: infer P) => void ? P : never
		>(
			...cleanableFns: T[]
		) =>
		(key: K) => {
			for (const fn of cleanableFns) fn(key);
		};

	return {
		cleanup,
		push,
		queue,
		batchQueue,
		allowCleanup,
		batchPush,
	};
}

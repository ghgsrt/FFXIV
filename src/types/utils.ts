// https://stackoverflow.com/a/52490977
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
	? R
	: _TupleOf<T, N, [T, ...R]>;
export type Tuple<T, N extends number> = N extends N
	? number extends N
		? T[]
		: _TupleOf<T, N, []>
	: never;

export type FilterKeysByValueType<T, V> = {
	[K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export type TailParameters<T extends (...args: any[]) => any> = (
	...args: Tail<Parameters<T>>
) => ReturnType<T>;

export type ExtraParameters<
	T extends (...args: any[]) => any,
	E extends any[]
> = (...args: [...Parameters<T>, ...E]) => ReturnType<T>;

export type Subset<K> = {
	[attr in keyof K]?: K[attr] extends (args: any) => any
		? K[attr]
		: K[attr] extends object
		? Subset<K[attr]>
		: K[attr] extends object | null
		? Subset<K[attr]> | null
		: K[attr] extends object | null | undefined
		? Subset<K[attr]> | null | undefined
		: K[attr];
};

export type OmitDefaults<T, D extends keyof T> = Omit<T, D | 'id'> &
	Subset<Pick<T, D>>;

export type EnsureFnParamTyping<T> = {
	[P in keyof T]: T[P] extends (...args: any[]) => any
		? (...args: Parameters<T[P]>) => ReturnType<T[P]>
		: T[P];
};

export type ExtendFirstParam<
	T extends (...args: any[]) => any,
	E extends any
> = (...args: [Parameters<T>[0] | E, ...Tail<Parameters<T>>]) => ReturnType<T>;

export type Async<T extends (...args: any[]) => any> = (
	...args: Parameters<T>
) => Promise<ReturnType<T>>;

export type EnforceArrayElements<T, E> = T extends Array<infer U>
	? U extends E
		? T
		: never
	: T;

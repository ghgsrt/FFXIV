export type LevelMod = {
	MP: number;
	MAIN: number;
	SUB: number;
	DIV: number;
	HP: number;
	ELMT?: number;
	THREAT?: number;
};

export const levelMods: Record<number, LevelMod> = {
	1: {
		MP: 10000,
		MAIN: 20,
		SUB: 56,
		DIV: 56,
		HP: 86,
		ELMT: 52,
		THREAT: 2,
	},
	90: {
		MP: 10000,
		MAIN: 390,
		SUB: 400,
		DIV: 1900,
		HP: 3000,
	},
} as const;

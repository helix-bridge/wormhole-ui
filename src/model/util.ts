export type ValueOf<T> = T[keyof T];

export type NoNullFields<O> = { [K in keyof O]: NonNullable<O[K]> };

export type RequiredPick<O, T extends keyof O> = Partial<O> & Required<Pick<O, T>>;

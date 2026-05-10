import { describe, it, expect } from 'vitest';
import * as ReaderEitherAsync from '@zambit/elevate-ts/ReaderEitherAsync';

import { saveTodos, loadTodos, type StorageEnv, type StorageError } from './domain.js';
import type { Todos } from './types.js';

const STORAGE_KEY = 'elevate-ts-todos';

const sampleTodos: Todos = [
	{ id: 1, title: 'Learn ReaderEitherAsync', done: false },
	{ id: 2, title: 'Ship it', done: true }
];

/** Build a fake storage backed by a Map; optional throwers simulate failure. */
const fakeStorage = (
	initial: Record<string, string> = {},
	options: { onGet?: () => void; onSet?: () => void } = {}
): { env: StorageEnv; data: Map<string, string> } => {
	const data = new Map(Object.entries(initial));
	const env: StorageEnv = {
		storage: {
			getItem: (key) => {
				options.onGet?.();
				return data.get(key) ?? null;
			},
			setItem: (key, value) => {
				options.onSet?.();
				data.set(key, value);
			}
		}
	};
	return { env, data };
};

describe('saveTodos', () => {
	it('writes the JSON-encoded todos to the injected storage and returns Right', async () => {
		const { env, data } = fakeStorage();
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(saveTodos(sampleTodos));
		expect(result.tag).toBe('Right');
		expect(data.get(STORAGE_KEY)).toBe(JSON.stringify(sampleTodos));
	});

	it('returns Left WriteFailed when the storage throws', async () => {
		const { env } = fakeStorage(
			{},
			{
				onSet: () => {
					throw new Error('quota exceeded');
				}
			}
		);
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(saveTodos(sampleTodos));
		expect(result.tag).toBe('Left');
		const left = (result as { tag: 'Left'; left: StorageError }).left;
		expect(left.tag).toBe('WriteFailed');
		expect((left.cause as Error).message).toBe('quota exceeded');
	});
});

describe('loadTodos', () => {
	it('returns Right with parsed todos when the key holds valid JSON', async () => {
		const { env } = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleTodos) });
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(loadTodos);
		expect(result.tag).toBe('Right');
		expect((result as { tag: 'Right'; right: Todos }).right).toEqual(sampleTodos);
	});

	it('returns Right([]) when the key is absent (fresh app)', async () => {
		const { env } = fakeStorage();
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(loadTodos);
		expect(result.tag).toBe('Right');
		expect((result as { tag: 'Right'; right: Todos }).right).toEqual([]);
	});

	it('returns Left ParseFailed when the stored value is not valid JSON', async () => {
		const { env } = fakeStorage({ [STORAGE_KEY]: '{not json' });
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(loadTodos);
		expect(result.tag).toBe('Left');
		expect((result as { tag: 'Left'; left: StorageError }).left.tag).toBe('ParseFailed');
	});

	it('returns Left ReadFailed when getItem throws', async () => {
		const { env } = fakeStorage(
			{},
			{
				onGet: () => {
					throw new Error('storage unavailable');
				}
			}
		);
		const result = await ReaderEitherAsync.runReaderEitherAsync(env)(loadTodos);
		expect(result.tag).toBe('Left');
		const left = (result as { tag: 'Left'; left: StorageError }).left;
		expect(left.tag).toBe('ReadFailed');
		expect((left.cause as Error).message).toBe('storage unavailable');
	});
});

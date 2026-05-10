# ReaderEitherAsync — When and Why

This is a learning-oriented walkthrough of the elevate-ts type
`ReaderEitherAsync<R, L, A>`, using the persistence layer of the
[example-elevate-ts-todo](../example-elevate-ts-todo) demo as a worked example.

If you have used `fp-ts`, this is the elevate-ts equivalent of `ReaderTaskEither`.

## What it is

`ReaderEitherAsync<R, L, A>` is a single value that captures three concerns at
once:

```text
ReaderEitherAsync<R, L, A>  ===  (env: R) => Promise<Either<L, A>>
```

- **R — the environment.** Things you need to do the work but did not produce
  yourself: a storage backend, an HTTP client, a logger, a config object.
- **L — the failure type.** A typed, recoverable error (a discriminated union
  is the usual choice).
- **A — the success type.** What you actually wanted.

It is **lazy**: nothing runs until you hand it an environment via
`runReaderEitherAsync(env)(rea)`.

## Why it exists

Most non-trivial I/O code has three independent worries:

1. **It depends on something.** A storage handle, a client, a key, a logger.
2. **It is asynchronous.** Storage, network, disk.
3. **It can fail in an expected way.** The disk is full, the JSON is corrupt,
   the user is offline.

elevate-ts has narrower types for each of these in isolation:

| You only have…       | Use                | Notes                                  |
| -------------------- | ------------------ | -------------------------------------- |
| failure              | `Either<L, A>`     | Synchronous, no environment.           |
| failure + async      | `EitherAsync<L, A>`| Adds `Promise`. No environment.        |
| dependency           | `Reader<R, A>`     | No failure, no async.                  |
| dependency + failure | (compose)          | Workable for sync; awkward for async.  |
| **all three**        | `ReaderEitherAsync<R, L, A>` | The point of this page.   |

Without the combined type, the alternatives are: thread the env through every
argument by hand, swallow errors as `Promise` rejections, or write a custom
type per call site. The combined type lets you compose all three concerns with
one set of operators (`map`, `chain`, `tryCatch`, `all`, `local`, `provide`).

## When to reach for it

A simple checklist. You probably want `ReaderEitherAsync` when **all three**
are true:

- [YES] You are doing I/O (fetch, storage, DB, queue, file, child process).
- [YES] It can fail in a way the caller should handle (not a panic).
- [YES] It depends on something you would want to swap — a real client in
  production, a fake in tests, a different driver in another environment.

If any one of those is false, prefer the simpler type:

- Sync but failable → `Either`.
- Async + failable, no deps → `EitherAsync`.
- Has deps, can't fail, sync → `Reader`.
- Pure transformation → just a function.

> [NOTE] Three-letter acronyms are not a goal. Reach for the simplest type
> that fits, and only widen when you actually have all three concerns.

## Worked example: the storage layer in this repo

The elevate-ts todo demo persists todos to `localStorage`. The full source is
in [example-elevate-ts-todo/src/lib/domain.ts](../example-elevate-ts-todo/src/lib/domain.ts);
this section walks through the parts that matter.

### The environment shape

The handler does not reach for the global `localStorage`. It receives a
storage *interface* it can call against. That makes the handler testable
without a browser, and swappable for any backend with the same shape.

```ts
export interface StorageEnv {
  readonly storage: Pick<Storage, 'getItem' | 'setItem'>;
}
```

`Pick<Storage, ...>` is deliberate — we only need two methods, so we ask for
exactly two. A test fake then needs only those two; a future swap to KV/IDB
just adapts to the same shape.

### The error shape

A discriminated union, so callers can branch on `tag` with full type safety
and no string parsing:

```ts
export type StorageError =
  | { readonly tag: 'WriteFailed'; readonly cause: unknown }
  | { readonly tag: 'ReadFailed'; readonly cause: unknown }
  | { readonly tag: 'ParseFailed'; readonly cause: unknown };
```

`cause: unknown` is honest — anything could come out of a `throw`. Callers
narrow it when they need to.

### The handlers

```ts
export const saveTodos = (
  todos: Todos
): ReaderEitherAsync.ReaderEitherAsync<StorageEnv, StorageError, void> =>
  ReaderEitherAsync.tryCatch(
    ({ storage }) => Promise.resolve(storage.setItem(STORAGE_KEY, JSON.stringify(todos))),
    (cause): StorageError => ({ tag: 'WriteFailed', cause })
  );
```

`tryCatch` is the canonical way to lift an env-aware async function into a
`ReaderEitherAsync`. Anything thrown or rejected becomes a typed `Left`.

```ts
const readRaw: ReaderEitherAsync.ReaderEitherAsync<StorageEnv, StorageError, string | null> =
  ReaderEitherAsync.tryCatch(
    ({ storage }) => Promise.resolve(storage.getItem(STORAGE_KEY)),
    (cause): StorageError => ({ tag: 'ReadFailed', cause })
  );

export const loadTodos: ReaderEitherAsync.ReaderEitherAsync<StorageEnv, StorageError, Todos> =
  ReaderEitherAsync.chain<StorageEnv, StorageError, string | null, Todos>((raw) =>
    raw === null
      ? ReaderEitherAsync.of<Todos>([])
      : ReaderEitherAsync.liftEither(parseTodos(raw))
  )(readRaw);
```

Two pieces worth noting:

- `chain` sequences another `ReaderEitherAsync` that shares the same `R` and
  `L`. The second computation only runs if the first produced `Right`.
- `liftEither` is how you bring a synchronous `Either` (here, the JSON parse)
  back into the async pipeline without nesting.

### The call site

In [+page.svelte](../example-elevate-ts-todo/src/routes/+page.svelte) the env
is built once, with an SSR guard:

```ts
const storageEnv: StorageEnv | null =
  typeof localStorage !== 'undefined' ? { storage: localStorage } : null;
```

Loading on mount:

```ts
onMount(async () => {
  if (!storageEnv) return;
  const result = await ReaderEitherAsync.runReaderEitherAsync(storageEnv)(loadTodos);
  if (result.tag === 'Right') {
    appState = { todos: result.right, filter: 'All', history: [], future: [] };
  } else {
    console.warn('[storage] load failed', result.left);
  }
});
```

Saving on every change is fire-and-forget — UI updates do not wait on
storage:

```ts
const persist = (todos: AppState['todos']): void => {
  if (!storageEnv) return;
  ReaderEitherAsync.runReaderEitherAsync(storageEnv)(saveTodos(todos)).then((result) => {
    if (result.tag === 'Left') console.warn('[storage] save failed', result.left);
  });
};
```

### The test

This is where the env earns its keep — see
[domain.test.ts](../example-elevate-ts-todo/src/lib/domain.test.ts). A
plain object stands in for `localStorage`, no DOM mocks, no spies:

```ts
const env: StorageEnv = {
  storage: {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); }
  }
};
const result = await ReaderEitherAsync.runReaderEitherAsync(env)(saveTodos(sampleTodos));
```

To test the failure paths, the fake just throws on the relevant method.

## Common patterns

A short tour of the operators you will reach for most often:

```ts
// Lift a value (no env, no failure)
ReaderEitherAsync.of(42);

// Lift a synchronous Either
ReaderEitherAsync.liftEither(Either.Right(42));

// Wrap a throwing async function
ReaderEitherAsync.tryCatch(
  async (env) => env.client.fetch(),
  (cause) => ({ tag: 'NetworkFailed', cause })
);

// Transform success
ReaderEitherAsync.map((n: number) => n * 2)(rea);

// Transform failure
ReaderEitherAsync.mapLeft((e: ErrA): ErrB => normalize(e))(rea);

// Sequence two computations sharing the same env
ReaderEitherAsync.chain((user: User) => loadOrders(user.id))(loadUser);

// Run an array in parallel; first Left wins
ReaderEitherAsync.all([loadUser, loadConfig, loadFeatureFlags]);

// Provide a narrower env to a sub-computation
ReaderEitherAsync.local((env: BigEnv) => env.smallSlice)(rea);

// Pin the env once and degrade to plain EitherAsync
const ea = ReaderEitherAsync.provide(env)(rea);
```

## Gotchas

- **SSR.** During server-side rendering, browser globals like `localStorage`
  do not exist. Build the env conditionally and short-circuit when it is
  absent. The `+page.svelte` example shows the pattern.
- **Module-load env vs per-request env.** For a singleton like browser
  storage, building the env once at module scope is fine. On a server, build
  the env *per request* — the env is the place where request-scoped
  dependencies (request id, current user, db transaction) live.
- **Don't reach for it when a plain function will do.** A pure transformation
  from `Todo[] -> Todo[]` is just a function. Do not wrap things that have no
  env, no async, and no failure mode.
- **Local elevate-ts dist must be current.** This repo links elevate-ts via a
  pnpm `overrides` entry pointing at `../elevate-ts`. If you edit
  `ReaderEitherAsync.ts` over there, rebuild its dist before this app sees
  the change.

## Alternatives we considered

For load failures, this demo logs to `console.warn` and continues with an
empty todo list. Other reasonable choices, depending on your app:

- **Visible error banner.** Best for production apps where a silent failure
  costs the user data. Adds UI surface to design.
- **Throw / let it crash.** Simplest code; defeats the point of `Either`.
  Use it only when you really want to bring the page down.
- **Retry with backoff.** Wrap the `ReaderEitherAsync` in a retrier; emit a
  banner only after final failure. Out of scope here.

The point of `Either` in `L` is that *the call site decides*. Picking a
different policy is a one-function change at the boundary, not a refactor of
the storage layer.

## See also

- Source: [ReaderEitherAsync.ts](../../elevate-ts/src/ReaderEitherAsync.ts)
- Worked example: [example-elevate-ts-todo/src/lib/domain.ts](../example-elevate-ts-todo/src/lib/domain.ts)
- Worked test: [example-elevate-ts-todo/src/lib/domain.test.ts](../example-elevate-ts-todo/src/lib/domain.test.ts)
- Call site: [example-elevate-ts-todo/src/routes/+page.svelte](../example-elevate-ts-todo/src/routes/+page.svelte)
